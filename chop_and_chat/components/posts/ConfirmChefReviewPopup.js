import { useTheme } from '../../context/ThemeContext';
import ConfirmationPopup from '../common/ConfirmationPopup';

export default function ConfirmChefReviewPopup({ visible, onConfirm, onCancel, onClose, loading, chefFilter, statusLabel }) {
    const { theme } = useTheme();

    const audienceLabel = chefFilter === 'Following'
        ? 'chefs you follow'
        : 'all verified chefs';

    return (
        <ConfirmationPopup
            visible={visible}
            onConfirm={onConfirm}
            onCancel={onCancel}
            onClose={onClose}
            loading={loading}
            statusLabel={statusLabel}
            iconName="ribbon"
            iconColor={theme.primary}
            iconBgColor={theme.primaryLighter}
            title="Submit for chef review?"
            subtitle={`Your request will be sent to ${audienceLabel}. A chef will review your dish and provide professional feedback.`}
            confirmText="Send Request"
            confirmIcon="paper-plane-outline"
            confirmColor={theme.primary}
        />
    );
}
