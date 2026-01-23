/**
 * Modal Component Tests
 *
 * Comprehensive unit tests for the Modal component and its subcomponents.
 * Covers open/close behavior, keyboard interaction, and accessibility requirements.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Modal, ModalBackdrop, ModalHeader, ModalBody, ModalFooter } from './Modal'

expect.extend(toHaveNoViolations)

describe('Modal', () => {
  describe('Open/Close Controlled Behavior', () => {
    it('renders nothing when isOpen is false', () => {
      const { container } = render(
        <Modal isOpen={false} onClose={vi.fn()}>
          Content
        </Modal>
      )
      expect(container).toBeEmptyDOMElement()
    })

    it('renders content when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Modal content
        </Modal>
      )
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('calls onClose when close button is clicked', async () => {
      const handleClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={handleClose} title="Test Modal">
          Content
        </Modal>
      )

      const closeButton = screen.getByLabelText('Close modal')
      await userEvent.click(closeButton)
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('renders in a portal (in document.body)', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Portal content
        </Modal>
      )

      const modalContent = screen.getByText('Portal content')
      // Content should be in a portal, not in a test container
      expect(modalContent.closest('[role="dialog"]')).toBeInTheDocument()
    })
  })

  describe('Backdrop Click', () => {
    it('closes modal when backdrop is clicked (default)', async () => {
      const handleClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={handleClose}>
          <ModalBody>Content</ModalBody>
        </Modal>
      )

      // Click on the backdrop (aria-hidden div)
      const backdrop = document.querySelector('[aria-hidden="true"]')
      expect(backdrop).toBeInTheDocument()
      fireEvent.click(backdrop!)
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('does not close when closeOnBackdrop is false', async () => {
      const handleClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={handleClose} closeOnBackdrop={false}>
          Content
        </Modal>
      )

      const backdrop = document.querySelector('[aria-hidden="true"]')
      fireEvent.click(backdrop!)
      expect(handleClose).not.toHaveBeenCalled()
    })

    it('does not close when clicking modal content', async () => {
      const handleClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={handleClose}>
          <ModalBody data-testid="modal-body">Content</ModalBody>
        </Modal>
      )

      const modalBody = screen.getByTestId('modal-body')
      await userEvent.click(modalBody)
      expect(handleClose).not.toHaveBeenCalled()
    })
  })

  describe('Escape Key', () => {
    it('closes modal when Escape is pressed (default)', async () => {
      const handleClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={handleClose}>
          Content
        </Modal>
      )

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('does not close when closeOnEscape is false', async () => {
      const handleClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={handleClose} closeOnEscape={false}>
          Content
        </Modal>
      )

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(handleClose).not.toHaveBeenCalled()
    })

    it('removes event listener when closed', () => {
      const handleClose = vi.fn()
      const { rerender } = render(
        <Modal isOpen={true} onClose={handleClose}>
          Content
        </Modal>
      )

      // Close the modal
      rerender(
        <Modal isOpen={false} onClose={handleClose}>
          Content
        </Modal>
      )

      // Reset mock
      handleClose.mockClear()

      // Press Escape - should not call onClose since modal is closed
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(handleClose).not.toHaveBeenCalled()
    })
  })

  describe('Body Scroll Prevention', () => {
    it('prevents body scroll when open (default)', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      )

      expect(document.body.style.overflow).toBe('hidden')
    })

    it('does not prevent scroll when preventScroll is false', () => {
      const originalOverflow = document.body.style.overflow
      render(
        <Modal isOpen={true} onClose={vi.fn()} preventScroll={false}>
          Content
        </Modal>
      )

      expect(document.body.style.overflow).toBe(originalOverflow)
    })

    it('restores body scroll on unmount', () => {
      const originalOverflow = document.body.style.overflow
      const { unmount } = render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      )

      expect(document.body.style.overflow).toBe('hidden')
      unmount()
      expect(document.body.style.overflow).toBe(originalOverflow)
    })
  })

  describe('Size Variants', () => {
    // Helper to get the modal content element (child of dialog container)
    const getModalContent = () => {
      const dialog = screen.getByRole('dialog')
      return dialog.querySelector('[class*="max-w-"]')
    }

    it('applies default (md) size styles', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      )

      const modal = getModalContent()
      expect(modal).toHaveClass('max-w-md')
    })

    it('applies small size styles', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} size="sm">
          Content
        </Modal>
      )

      const modal = getModalContent()
      expect(modal).toHaveClass('max-w-sm')
    })

    it('applies large size styles', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} size="lg">
          Content
        </Modal>
      )

      const modal = getModalContent()
      expect(modal).toHaveClass('max-w-lg')
    })

    it('applies extra large size styles', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} size="xl">
          Content
        </Modal>
      )

      const modal = getModalContent()
      expect(modal).toHaveClass('max-w-xl')
    })

    it('applies full size styles', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} size="full">
          Content
        </Modal>
      )

      const modal = getModalContent()
      expect(modal).toHaveClass('max-w-[calc(100vw-2rem)]')
    })
  })

  describe('Title and Close Button', () => {
    it('renders title in header', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="My Title">
          Content
        </Modal>
      )

      expect(screen.getByText('My Title')).toBeInTheDocument()
    })

    it('shows close button by default with title', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test">
          Content
        </Modal>
      )

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument()
    })

    it('hides close button when showCloseButton is false', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test" showCloseButton={false}>
          Content
        </Modal>
      )

      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument()
    })

    it('does not render header when no title', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <ModalBody>Content</ModalBody>
        </Modal>
      )

      // No header should be rendered - check there's no "Close modal" button
      expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument()
    })
  })

  describe('Animation Presence', () => {
    // Helper to get the modal content element
    const getModalContent = () => {
      const dialog = screen.getByRole('dialog')
      return dialog.querySelector('[class*="will-change-transform"]')
    }

    it('uses Framer Motion for animations', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      )

      // Modal should be rendered (Framer Motion handles the animations)
      const modal = getModalContent()
      expect(modal).toBeInTheDocument()
    })

    it('has will-change-transform for GPU acceleration', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      )

      const modal = getModalContent()
      expect(modal).toHaveClass('will-change-transform')
    })
  })

  describe('Accessibility', () => {
    it('has role="dialog"', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('has aria-modal="true"', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('has aria-labelledby when title is provided', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Title">
          Content
        </Modal>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
      expect(screen.getByText('Test Title').closest('#modal-title')).toBeInTheDocument()
    })

    it('does not have aria-labelledby without title', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).not.toHaveAttribute('aria-labelledby')
    })

    it('has no accessibility violations', async () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Accessible Modal">
          <ModalBody>Modal content</ModalBody>
          <ModalFooter>
            <button type="button">Close</button>
          </ModalFooter>
        </Modal>
      )

      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Centering', () => {
    it('centers modal by default', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          Content
        </Modal>
      )

      // The dialog element IS the container with centering classes
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('items-center')
    })

    it('aligns modal to top when centered is false', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} centered={false}>
          Content
        </Modal>
      )

      // The dialog element has the centering classes
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('items-start', 'pt-20')
    })
  })

  describe('Custom Classes', () => {
    // Helper to get the modal content element
    const getModalContent = () => {
      const dialog = screen.getByRole('dialog')
      return dialog.querySelector('[class*="bg-surface-primary"]')
    }

    it('merges custom className with modal', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} className="custom-modal">
          Content
        </Modal>
      )

      const modal = getModalContent()
      expect(modal).toHaveClass('custom-modal')
    })

    it('merges custom backdropClassName', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} backdropClassName="custom-backdrop">
          Content
        </Modal>
      )

      const backdrop = document.querySelector('[aria-hidden="true"]')
      expect(backdrop).toHaveClass('custom-backdrop')
    })
  })

  describe('Ref Forwarding', () => {
    it('forwards ref to modal element', () => {
      const ref = createRef<HTMLDivElement>()
      render(
        <Modal isOpen={true} onClose={vi.fn()} ref={ref}>
          Content
        </Modal>
      )

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })
})

describe('ModalBackdrop', () => {
  it('renders when isOpen is true', () => {
    render(<ModalBackdrop isOpen={true} data-testid="backdrop" />)
    expect(screen.getByTestId('backdrop')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(<ModalBackdrop isOpen={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('applies backdrop styles', () => {
    render(<ModalBackdrop isOpen={true} data-testid="backdrop" />)
    const backdrop = screen.getByTestId('backdrop')
    expect(backdrop).toHaveClass('fixed', 'inset-0', 'z-50', 'backdrop-blur-sm')
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    render(<ModalBackdrop isOpen={true} onClick={handleClick} data-testid="backdrop" />)

    await userEvent.click(screen.getByTestId('backdrop'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('has aria-hidden="true"', () => {
    render(<ModalBackdrop isOpen={true} data-testid="backdrop" />)
    expect(screen.getByTestId('backdrop')).toHaveAttribute('aria-hidden', 'true')
  })

  it('has correct displayName', () => {
    expect(ModalBackdrop.displayName).toBe('ModalBackdrop')
  })
})

describe('ModalHeader', () => {
  it('renders children content', () => {
    render(<ModalHeader>Header Title</ModalHeader>)
    expect(screen.getByText('Header Title')).toBeInTheDocument()
  })

  it('applies header styles', () => {
    render(<ModalHeader data-testid="header">Title</ModalHeader>)
    const header = screen.getByTestId('header')
    expect(header).toHaveClass('flex', 'items-center', 'justify-between', 'px-6', 'py-4')
  })

  it('applies bottom border', () => {
    render(<ModalHeader data-testid="header">Title</ModalHeader>)
    const header = screen.getByTestId('header')
    expect(header).toHaveClass('border-b')
  })

  it('shows close button when showCloseButton is true', () => {
    const handleClose = vi.fn()
    render(
      <ModalHeader showCloseButton onClose={handleClose}>
        Title
      </ModalHeader>
    )

    const closeButton = screen.getByLabelText('Close modal')
    expect(closeButton).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const handleClose = vi.fn()
    render(
      <ModalHeader showCloseButton onClose={handleClose}>
        Title
      </ModalHeader>
    )

    await userEvent.click(screen.getByLabelText('Close modal'))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('does not show close button when showCloseButton is false', () => {
    render(
      <ModalHeader showCloseButton={false} onClose={vi.fn()}>
        Title
      </ModalHeader>
    )

    expect(screen.queryByLabelText('Close modal')).not.toBeInTheDocument()
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<ModalHeader ref={ref}>Title</ModalHeader>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    render(
      <ModalHeader data-testid="header" className="custom-header">
        Title
      </ModalHeader>
    )
    const header = screen.getByTestId('header')
    expect(header).toHaveClass('custom-header', 'px-6')
  })

  it('has correct displayName', () => {
    expect(ModalHeader.displayName).toBe('ModalHeader')
  })
})

describe('ModalBody', () => {
  it('renders children content', () => {
    render(<ModalBody>Body content</ModalBody>)
    expect(screen.getByText('Body content')).toBeInTheDocument()
  })

  it('applies body styles', () => {
    render(<ModalBody data-testid="body">Content</ModalBody>)
    const body = screen.getByTestId('body')
    expect(body).toHaveClass('px-6', 'py-4', 'overflow-y-auto')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<ModalBody ref={ref}>Content</ModalBody>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    render(
      <ModalBody data-testid="body" className="custom-body">
        Content
      </ModalBody>
    )
    const body = screen.getByTestId('body')
    expect(body).toHaveClass('custom-body', 'px-6')
  })

  it('has correct displayName', () => {
    expect(ModalBody.displayName).toBe('ModalBody')
  })
})

describe('ModalFooter', () => {
  it('renders children content', () => {
    render(<ModalFooter>Footer content</ModalFooter>)
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })

  it('applies footer styles', () => {
    render(<ModalFooter data-testid="footer">Content</ModalFooter>)
    const footer = screen.getByTestId('footer')
    expect(footer).toHaveClass('flex', 'items-center', 'justify-end', 'gap-3', 'px-6', 'py-4')
  })

  it('applies top border', () => {
    render(<ModalFooter data-testid="footer">Content</ModalFooter>)
    const footer = screen.getByTestId('footer')
    expect(footer).toHaveClass('border-t')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLDivElement>()
    render(<ModalFooter ref={ref}>Content</ModalFooter>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('merges custom className', () => {
    render(
      <ModalFooter data-testid="footer" className="custom-footer">
        Content
      </ModalFooter>
    )
    const footer = screen.getByTestId('footer')
    expect(footer).toHaveClass('custom-footer', 'px-6')
  })

  it('has correct displayName', () => {
    expect(ModalFooter.displayName).toBe('ModalFooter')
  })
})

describe('Modal Composition', () => {
  it('renders complete modal with all subcomponents', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Modal Title">
        <ModalBody data-testid="body">
          <p>Main content goes here</p>
        </ModalBody>
        <ModalFooter data-testid="footer">
          <button type="button">Cancel</button>
          <button type="button">Submit</button>
        </ModalFooter>
      </Modal>
    )

    expect(screen.getByText('Modal Title')).toBeInTheDocument()
    expect(screen.getByTestId('body')).toBeInTheDocument()
    expect(screen.getByTestId('footer')).toBeInTheDocument()
    expect(screen.getByText('Main content goes here')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })

  it('has no accessibility violations with full composition', async () => {
    const { container } = render(
      <Modal isOpen={true} onClose={vi.fn()} title="Accessible Modal">
        <ModalBody>
          <p>This is accessible content</p>
        </ModalBody>
        <ModalFooter>
          <button type="button">Cancel</button>
          <button type="button">Confirm</button>
        </ModalFooter>
      </Modal>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
