/**
 * PhishYou — Toast hook
 * Spec: IMPLEMENTATION_CHECKLIST.md — Toast notifications (success/error/warning/info,
 *       auto-dismiss 5s, errors persist, slide-in-right 300ms)
 *
 * Thin accessor over the toast queue owned by AppContext. Pages call:
 *   const toast = useToast();
 *   toast.success('Campaign launched', 'First messages are being delivered.');
 */
import { useAppContext } from '../context/AppContext';

export function useToast() {
  return useAppContext().toast;
}
