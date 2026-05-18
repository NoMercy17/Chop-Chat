import React, { useState, useRef, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, Pressable,
  ScrollView, Animated, Easing, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { wp, hp, fp } from '../../utils/responsive';

const QUESTIONS = [
  {
    id: 1,
    text: 'Who holds the record for the most Michelin stars?',
    options: [
      { id: 'A', label: 'Gordon Ramsay' },
      { id: 'B', label: 'Joel Robuchon' },
      { id: 'C', label: 'Jamie Oliver' },
      { id: 'D', label: 'Heston Blumenthal' },
    ],
    correct: 'B',
  },
  {
    id: 2,
    text: "What does it mean to cook something 'al dente'?",
    options: [
      { id: 'A', label: 'Cooked until very soft' },
      { id: 'B', label: 'Cooked in the oven' },
      { id: 'C', label: 'Cooked so it still has a slight bite' },
      { id: 'D', label: 'Cooked without salt' },
    ],
    correct: 'C',
  },
  {
    id: 3,
    text: 'What is the danger zone temperature range where bacteria grows fastest in food?',
    options: [
      { id: 'A', label: '0C - 20C' },
      { id: 'B', label: '4C - 60C' },
      { id: 'C', label: '60C - 100C' },
      { id: 'D', label: '-18C - 0C' },
    ],
    correct: 'B',
  },
  {
    id: 4,
    text: 'A chef tastes their sauce and says it needs more acidity. What do they reach for?',
    options: [
      { id: 'A', label: 'Heavy cream' },
      { id: 'B', label: 'Butter' },
      { id: 'C', label: 'A splash of lemon juice or vinegar' },
      { id: 'D', label: 'More salt' },
    ],
    correct: 'C',
  },
];

export default function ChefQuizModal({ visible, onPass, onClose, theme }) {
  const [answers, setAnswers] = useState({});
  const [wrongIds, setWrongIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Sheet entrance: slide up from bottom + fade, iOS drawer easing
  const sheetSlide = useRef(new Animated.Value(hp(60))).current;
  const sheetFade = useRef(new Animated.Value(0)).current;

  // One shake Animated.Value per question for wrong-answer feedback
  const shakeAnims = useRef(QUESTIONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      setAnswers({});
      setWrongIds([]);
      setSubmitting(false);
      sheetSlide.setValue(hp(60));
      sheetFade.setValue(0);
      Animated.parallel([

        
        Animated.timing(sheetSlide, {
          toValue: 0,
          duration: 360,
          // iOS drawer curve (Ionic): feels like the system sheet
          easing: Easing.bezier(0.32, 0.72, 0, 1),
          useNativeDriver: true,
        }),
        Animated.timing(sheetFade, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const selectAnswer = (qId, optId) => {
    setAnswers(prev => ({ ...prev, [qId]: optId }));
    // Dismiss wrong indicator as soon as they pick a new answer
    if (wrongIds.includes(qId)) {
      setWrongIds(prev => prev.filter(id => id !== qId));
    }
  };

  // Six-frame horizontal shake: fast, assertive, decays to zero (300ms total)
  const triggerShake = (index) => {
    const anim = shakeAnims[index];
    anim.setValue(0);
    Animated.sequence([
      Animated.timing(anim, { toValue: -7, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(anim, { toValue:  7, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(anim, { toValue: -5, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(anim, { toValue:  5, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(anim, { toValue: -2, duration: 50, useNativeDriver: true, easing: Easing.linear }),
      Animated.timing(anim, { toValue:  0, duration: 50, useNativeDriver: true, easing: Easing.linear }),
    ]).start();
  };

  const handleSubmit = async () => {
    const allAnswered = QUESTIONS.every(q => answers[q.id]);
    if (!allAnswered || submitting) return;

    const wrong = QUESTIONS
      .filter(q => answers[q.id] !== q.correct)
      .map(q => q.id);

    if (wrong.length === 0) {
      setSubmitting(true);
      await onPass();
      // onPass either navigates away or closes the modal on error —
      // only reset submitting if we're somehow still mounted
      setSubmitting(false);
    } else {
      setWrongIds(wrong);
      wrong.forEach(qId => {
        triggerShake(QUESTIONS.findIndex(q => q.id === qId));
      });
      // Keep correct answers; clear only wrong ones
      setAnswers(prev => {
        const next = { ...prev };
        wrong.forEach(id => { next[id] = undefined; });
        return next;
      });
    }
  };

  const allAnswered = QUESTIONS.every(q => answers[q.id]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: theme.cardBackground },
            { opacity: sheetFade, transform: [{ translateY: sheetSlide }] },
          ]}
        >
          {/* Drag handle + close button row */}
          <View style={styles.topRow}>
            <View style={[styles.handle, { backgroundColor: theme.borderDark }]} />
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder },
                pressed && { opacity: 0.7, transform: [{ scale: 0.93 }] },
              ]}
            >
              <Ionicons name="close" size={fp(16)} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.title, { color: theme.textPrimary }]}>
              Before you join as a Chef
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Answer these questions to show you have what it takes.
            </Text>

            {QUESTIONS.map((q, index) => {
              const isWrong = wrongIds.includes(q.id);
              return (
                <Animated.View
                  key={q.id}
                  style={[
                    styles.questionBlock,
                    { transform: [{ translateX: shakeAnims[index] }] },
                  ]}
                >
                  <View style={styles.questionHeader}>
                    <View style={[
                      styles.questionBadge,
                      { backgroundColor: isWrong ? theme.danger : theme.primary },
                    ]}>
                      <Text style={[styles.qNum, { color: theme.textInverse }]}>
                        {q.id}
                      </Text>
                    </View>
                    <Text style={[styles.questionText, { color: theme.textPrimary }]}>
                      {q.text}
                    </Text>
                  </View>

                  {isWrong && (
                    <Text style={[styles.wrongHint, { color: theme.danger }]}>
                      {`Question ${q.id}: wrong answer, pick again.`}
                    </Text>
                  )}

                  <View style={styles.optionsList}>
                    {q.options.map(opt => {
                      const selected = answers[q.id] === opt.id;
                      return (
                        <Pressable
                          key={opt.id}
                          onPress={() => selectAnswer(q.id, opt.id)}
                          style={({ pressed }) => [
                            styles.optionCard,
                            {
                              backgroundColor: selected
                                ? theme.primary
                                : theme.inputBackground,
                              borderColor: selected
                                ? theme.primaryDark
                                : theme.inputBorder,
                            },
                            pressed && styles.optionPressed,
                          ]}
                        >
                          <View style={[
                            styles.letterBadge,
                            {
                              backgroundColor: selected
                                ? theme.primaryDark
                                : theme.border,
                            },
                          ]}>
                            <Text style={[
                              styles.letterText,
                              {
                                color: selected
                                  ? theme.textInverse
                                  : theme.textMuted,
                              },
                            ]}>
                              {opt.id}
                            </Text>
                          </View>
                          <Text style={[
                            styles.optionLabel,
                            { color: selected ? theme.textInverse : theme.textPrimary },
                          ]}>
                            {opt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>
              );
            })}

            <Pressable
              onPress={handleSubmit}
              disabled={!allAnswered || submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor: allAnswered
                    ? theme.primaryDark
                    : theme.borderLight,
                },
                (!allAnswered || submitting) && styles.submitDisabled,
                pressed && allAnswered && !submitting && styles.submitPressed,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={theme.textInverse} />
              ) : (
                <Text style={[
                  styles.submitLabel,
                  { color: allAnswered ? theme.textInverse : theme.textTertiary },
                ]}>
                  Check My Knowledge
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    borderTopLeftRadius: wp(28),
    borderTopRightRadius: wp(28),
    maxHeight: '92%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: hp(14),
    paddingHorizontal: wp(20),
    paddingBottom: hp(6),
  },
  handle: {
    width: wp(40),
    height: hp(4),
    borderRadius: wp(2),
    opacity: 0.25,
  },
  closeBtn: {
    position: 'absolute',
    right: wp(20),
    width: wp(32),
    height: wp(32),
    borderRadius: wp(16),
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: wp(24),
    paddingTop: hp(16),
    paddingBottom: hp(48),
  },
  title: {
    fontSize: fp(22),
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: hp(6),
  },
  subtitle: {
    fontSize: fp(14),
    lineHeight: fp(21),
    marginBottom: hp(28),
  },
  questionBlock: {
    marginBottom: hp(28),
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: wp(12),
    marginBottom: hp(10),
  },
  questionBadge: {
    width: wp(26),
    height: wp(26),
    borderRadius: wp(13),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: hp(2),
  },
  qNum: {
    fontSize: fp(12),
    fontWeight: '800',
  },
  questionText: {
    flex: 1,
    fontSize: fp(15),
    fontWeight: '600',
    lineHeight: fp(22),
  },
  wrongHint: {
    fontSize: fp(13),
    fontWeight: '600',
    marginBottom: hp(8),
    paddingLeft: wp(38),
  },
  optionsList: {
    gap: hp(8),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: wp(14),
    borderWidth: 1.5,
    paddingVertical: hp(13),
    paddingHorizontal: wp(14),
    gap: wp(12),
  },
  // scale(0.97) + opacity on press — per Emil: buttons must feel responsive (100-160ms)
  optionPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.88,
  },
  letterBadge: {
    width: wp(28),
    height: wp(28),
    borderRadius: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  letterText: {
    fontSize: fp(13),
    fontWeight: '800',
  },
  optionLabel: {
    flex: 1,
    fontSize: fp(14),
    fontWeight: '500',
    lineHeight: fp(20),
  },
  submitBtn: {
    height: hp(56),
    borderRadius: wp(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(8),
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.87,
  },
  submitLabel: {
    fontSize: fp(16),
    fontWeight: '700',
  },
});
