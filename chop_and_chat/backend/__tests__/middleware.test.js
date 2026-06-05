jest.mock('jsonwebtoken');
jest.mock('../db', () => ({ query: jest.fn() }));

const jwt = require('jsonwebtoken');
const pool = require('../db');
const { authenticateToken, requireChef, requireOwnership } = require('../middleware');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── authenticateToken ────────────────────────────────────────────────────────

describe('authenticateToken', () => {
  test('returns 401 when Authorization header is missing', async () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'missing token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when Authorization header has no token after Bearer', async () => {
    const req = { headers: { authorization: 'Bearer' } };
    const res = mockRes();
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'malformed token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when JWT signature is invalid', async () => {
    jwt.verify.mockImplementation(() => { throw new Error('invalid signature'); });

    const req = { headers: { authorization: 'Bearer bad.token.here' } };
    const res = mockRes();
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 when token is valid but user no longer exists in the database', async () => {
    jwt.verify.mockReturnValue({ id: 99, role: 'user' });
    pool.query.mockResolvedValue({ rows: [] });

    const req = { headers: { authorization: 'Bearer valid.token.here' } };
    const res = mockRes();
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'invalid token' });
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() and sets req.user when token is valid and user exists', async () => {
    const payload = { id: 1, role: 'user' };
    jwt.verify.mockReturnValue(payload);
    pool.query.mockResolvedValue({ rows: [{ id: 1 }] });

    const req = { headers: { authorization: 'Bearer valid.token.here' } };
    const res = mockRes();
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(payload);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('returns 500 when the database check throws an error', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jwt.verify.mockReturnValue({ id: 1, role: 'user' });
    pool.query.mockRejectedValue(new Error('connection refused'));

    const req = { headers: { authorization: 'Bearer valid.token.here' } };
    const res = mockRes();
    const next = jest.fn();

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'server error' });
    expect(next).not.toHaveBeenCalled();
  });
});

// ─── requireChef ─────────────────────────────────────────────────────────────

describe('requireChef', () => {
  test('returns 401 when req.user is not set', () => {
    const req = {};
    const res = mockRes();
    const next = jest.fn();

    requireChef(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when the authenticated user has role "user"', () => {
    const req = { user: { id: 1, role: 'user' } };
    const res = mockRes();
    const next = jest.fn();

    requireChef(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'chef access required' });
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() when the authenticated user has role "chef"', () => {
    const req = { user: { id: 2, role: 'chef' } };
    const res = mockRes();
    const next = jest.fn();

    requireChef(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ─── requireOwnership ────────────────────────────────────────────────────────

describe('requireOwnership', () => {
  test('returns 400 when the resource user ID is missing', async () => {
    const middleware = requireOwnership('userId');
    const req = { user: { id: 1 }, params: {}, body: {} };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'missing user identifier' });
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 403 when the resource belongs to a different user', async () => {
    const middleware = requireOwnership('userId');
    const req = { user: { id: 1 }, params: { userId: '2' }, body: {} };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'not authorized to access this resource' });
    expect(next).not.toHaveBeenCalled();
  });

  test('calls next() when the resource belongs to the authenticated user', async () => {
    const middleware = requireOwnership('userId');
    const req = { user: { id: 5 }, params: { userId: '5' }, body: {} };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('reads the owner ID from req.body when not in req.params', async () => {
    const middleware = requireOwnership('userId');
    const req = { user: { id: 3 }, params: {}, body: { userId: '3' } };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test('uses a custom key name when provided', async () => {
    const middleware = requireOwnership('ownerId');
    const req = { user: { id: 7 }, params: { ownerId: '7' }, body: {} };
    const res = mockRes();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
