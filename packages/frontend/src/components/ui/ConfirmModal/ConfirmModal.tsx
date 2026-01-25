/**
 * ConfirmModal and FormModal Components
 *
 * Specialized modal compositions for common use cases:
 * - ConfirmModal: Quick confirmation dialogs
 * - FormModal: Forms in modal dialogs
 *
 * @example
 * // Confirmation dialog
 * <ConfirmModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Item"
 *   confirmText="Delete"
 *   confirmVariant="danger"
 * >
 *   Are you sure you want to delete this item? This action cannot be undone.
 * </ConfirmModal>
 *
 * @example
 * // Form modal
 * <FormModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSubmit={handleSubmit}
 *   title="Edit Profile"
 * >
 *   <FormField label="Name">
 *     <Input name="name" />
 *   </FormField>
 *   <FormField label="Email">
 *     <Input type="email" name="email" />
 *   </FormField>
 * </FormModal>
 */

import { forwardRef, useState, type FormEvent } from 'react';
import { Modal, ModalBody, ModalFooter } from '../Modal';
import { Button } from '../Button';
import type { ConfirmModalProps, FormModalProps } from './ConfirmModal.types';

/**
 * ConfirmModal Component
 *
 * A pre-composed modal for confirmation dialogs with confirm/cancel buttons.
 */
export const ConfirmModal = forwardRef<HTMLDivElement, ConfirmModalProps>(
  (
    {
      isOpen,
      onClose,
      onConfirm,
      title,
      children,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmVariant = 'primary',
      isLoading = false,
      loadingText = 'Processing...',
      closeOnConfirm = true,
      closeOnBackdrop = true,
      size = 'sm',
      className,
    },
    ref
  ) => {
    const [internalLoading, setInternalLoading] = useState(false);
    const loading = isLoading || internalLoading;

    const handleConfirm = async () => {
      try {
        setInternalLoading(true);
        await onConfirm();
        if (closeOnConfirm) {
          onClose();
        }
      } catch (_error) {
        // Error handling should be done by the onConfirm callback
        // Silently fail - errors should be handled by the onConfirm callback
      } finally {
        setInternalLoading(false);
      }
    };

    return (
      <Modal
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size={size}
        closeOnBackdrop={closeOnBackdrop}
        className={className}
      >
        <ModalBody>
          <div className="text-text-secondary">{children}</div>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={handleConfirm}
            isLoading={loading}
            loadingText={loadingText}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </Modal>
    );
  }
);

ConfirmModal.displayName = 'ConfirmModal';

/**
 * FormModal Component
 *
 * A pre-composed modal for form submissions with submit/cancel buttons.
 */
export const FormModal = forwardRef<HTMLDivElement, FormModalProps>(
  (
    {
      isOpen,
      onClose,
      onSubmit,
      title,
      children,
      submitText = 'Submit',
      cancelText = 'Cancel',
      submitVariant = 'primary',
      isSubmitting = false,
      loadingText = 'Submitting...',
      closeOnSubmit = true,
      closeOnBackdrop = false,
      size = 'md',
      className,
      formId = 'form-modal',
    },
    ref
  ) => {
    const [internalSubmitting, setInternalSubmitting] = useState(false);
    const submitting = isSubmitting || internalSubmitting;

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const formData = new FormData(e.currentTarget);

      try {
        setInternalSubmitting(true);
        await onSubmit(formData);
        if (closeOnSubmit) {
          onClose();
        }
      } catch (_error) {
        // Error handling should be done by the onSubmit callback
        // Silently fail - errors should be handled by the onSubmit callback
      } finally {
        setInternalSubmitting(false);
      }
    };

    return (
      <Modal
        ref={ref}
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size={size}
        closeOnBackdrop={closeOnBackdrop}
        className={className}
      >
        <form id={formId} onSubmit={handleSubmit}>
          <ModalBody>{children}</ModalBody>

          <ModalFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              {cancelText}
            </Button>
            <Button
              type="submit"
              variant={submitVariant}
              isLoading={submitting}
              loadingText={loadingText}
            >
              {submitText}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    );
  }
);

FormModal.displayName = 'FormModal';

export default ConfirmModal;
