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
            iconColor={theme.paid}
            iconBgColor={theme.paidLight}
            title="Ready to pay & submit?"
            subtitle={`Your request will be sent to ${audienceLabel}. Tapping below opens a secure $0.50 payment — once paid, the review request is submitted.`}
            confirmText="Pay $0.50 & Submit"
            confirmIcon="card-outline"
            confirmColor={theme.paid}
        />
    );
}
