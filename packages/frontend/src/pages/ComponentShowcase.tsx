/**
 * Component Showcase Page
 *
 * Demonstrates all extended component library features for Feature #1246
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { FormField, FormGroup } from '@/components/ui/FormField';
import { ConfirmModal, FormModal } from '@/components/ui/ConfirmModal';
import { Tooltip, Popover } from '@/components/ui/Tooltip';

export default function ComponentShowcase() {
  // Modal states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);

  // Form handlers
  const handleConfirm = async () => {
    // Simulate async confirmation
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  const handleFormSubmit = async (_formData: FormData) => {
    // Simulate async form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-text-primary font-display">
            Extended Component Library
          </h1>
          <p className="text-text-muted">Feature #1246: Advanced variants and compositions</p>
        </div>

        {/* FormField and FormGroup */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-text-primary">Form Composition Components</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {/* Individual FormField */}
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">FormField Component</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Username" helperText="Choose a unique username" required>
                    <Input placeholder="Enter username" />
                  </FormField>

                  <FormField label="Email" error="Invalid email format" required>
                    <Input type="email" placeholder="you@example.com" error />
                  </FormField>
                </div>
              </div>

              {/* FormGroup */}
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">FormGroup Component</h3>
                <FormGroup
                  title="Account Information"
                  description="Update your account details below"
                  spacing="md"
                >
                  <FormField label="Display Name" required>
                    <Input placeholder="John Doe" />
                  </FormField>

                  <FormField label="Bio" helperText="Tell us about yourself (optional)">
                    <Input placeholder="Game enthusiast..." />
                  </FormField>
                </FormGroup>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Modal Compositions */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-text-primary">Modal Compositions</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ConfirmModal */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-text-primary">ConfirmModal</h3>
                <p className="text-sm text-text-muted mb-3">
                  Pre-composed confirmation dialog with confirm/cancel buttons
                </p>
                <Button onClick={() => setConfirmOpen(true)} variant="danger">
                  Delete Item
                </Button>
              </div>

              {/* FormModal */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-text-primary">FormModal</h3>
                <p className="text-sm text-text-muted mb-3">
                  Form submission modal with validation support
                </p>
                <Button onClick={() => setFormModalOpen(true)}>Edit Profile</Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Tooltip and Popover */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-text-primary">
              Tooltip and Popover Components
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {/* Tooltips */}
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">Tooltip Variants</h3>
                <div className="flex flex-wrap gap-3">
                  <Tooltip content="Default tooltip" placement="top">
                    <Button variant="ghost" size="sm">
                      Hover Default
                    </Button>
                  </Tooltip>

                  <Tooltip content="Information tooltip" variant="info" placement="top">
                    <Button variant="ghost" size="sm">
                      Hover Info
                    </Button>
                  </Tooltip>

                  <Tooltip content="Success message" variant="success" placement="right">
                    <Button variant="ghost" size="sm">
                      Hover Success
                    </Button>
                  </Tooltip>

                  <Tooltip content="Warning message" variant="warning" placement="bottom">
                    <Button variant="ghost" size="sm">
                      Hover Warning
                    </Button>
                  </Tooltip>

                  <Tooltip content="Error message" variant="error" placement="left">
                    <Button variant="ghost" size="sm">
                      Hover Error
                    </Button>
                  </Tooltip>

                  <Tooltip content="Click me!" trigger="click" placement="top">
                    <Button variant="outline" size="sm">
                      Click Tooltip
                    </Button>
                  </Tooltip>
                </div>
              </div>

              {/* Popovers */}
              <div>
                <h3 className="text-lg font-medium text-text-primary mb-4">Popover Component</h3>
                <div className="flex flex-wrap gap-3">
                  <Popover
                    title="Quick Actions"
                    content={
                      <div className="flex flex-col gap-2">
                        <Button size="sm" fullWidth>
                          Action 1
                        </Button>
                        <Button size="sm" fullWidth>
                          Action 2
                        </Button>
                        <Button size="sm" fullWidth variant="danger">
                          Delete
                        </Button>
                      </div>
                    }
                    placement="bottom-start"
                  >
                    <Button>Actions Menu</Button>
                  </Popover>

                  <Popover
                    title="Information"
                    content={
                      <div className="space-y-2">
                        <p className="text-sm">This is a popover with more complex content.</p>
                        <p className="text-sm">It can contain any React elements.</p>
                      </div>
                    }
                    showCloseButton
                    placement="bottom"
                  >
                    <Button variant="outline">Info Popover</Button>
                  </Popover>

                  <Popover
                    content={<div className="text-sm">Hover to see this popover!</div>}
                    trigger="hover"
                    placement="right"
                  >
                    <Button variant="ghost">Hover Popover</Button>
                  </Popover>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Advanced Button Variants (Already Exists) */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-text-primary">Advanced Button Variants</h2>
            <p className="text-sm text-text-muted">Already implemented in base library</p>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="success">Success</Button>
              <Button iconOnly>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Compound Card Components (Already Exists) */}
        <Card variant="elevated">
          <CardHeader>
            <h2 className="text-xl font-semibold text-text-primary">Compound Card Components</h2>
            <p className="text-sm text-text-muted">
              Already implemented: Card with Header/Body/Footer
            </p>
          </CardHeader>
          <CardBody>
            <p className="text-text-secondary">
              This demonstrates the Card component with separate Header, Body, and Footer sections.
              Each section is properly styled and spaced according to the design system.
            </p>
          </CardBody>
          <CardFooter>
            <Button variant="ghost">Cancel</Button>
            <Button>Save Changes</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        title="Confirm Deletion"
        confirmText="Delete"
        confirmVariant="danger"
      >
        Are you sure you want to delete this item? This action cannot be undone.
      </ConfirmModal>

      <FormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        title="Edit Profile"
        submitText="Save Changes"
      >
        <FormGroup spacing="md">
          <FormField label="Display Name" required>
            <Input name="displayName" placeholder="John Doe" />
          </FormField>

          <FormField label="Email" required>
            <Input name="email" type="email" placeholder="you@example.com" />
          </FormField>

          <FormField label="Bio" helperText="Tell us about yourself">
            <Input name="bio" placeholder="Game enthusiast..." />
          </FormField>
        </FormGroup>
      </FormModal>
    </div>
  );
}
