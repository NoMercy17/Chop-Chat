import { useTheme } from '../../context/ThemeContext';
import ConfirmationPopup from '../common/ConfirmationPopup';

export default function ConfirmPostPopup({ visible, onConfirm, onCancel, onClose, loading, statusLabel }) {
    const { theme } = useTheme();

    return (
        <ConfirmationPopup
            visible={visible}
            onConfirm={onConfirm}
            onCancel={onCancel}
            onClose={onClose}
            loading={loading}
            statusLabel={statusLabel}
            iconName="restaurant"
            iconColor={theme.primary}
            iconBgColor={theme.primaryLighter}
            title="Share with the community?"
            subtitle="Your dish will be posted to the community feed for others to discover and enjoy."
            confirmText="Post to Feed"
            confirmIcon="checkmark-circle-outline"
            confirmColor={theme.primary}
        />
    );
}
