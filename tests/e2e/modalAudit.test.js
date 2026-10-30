import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('TechDesk Custom Modal Dialogs & Native Alert Audit', () => {
  const frontendSrcDir = path.resolve(__dirname, '../../frontend/src');

  // Helper to recursively collect all js/jsx files
  function getSourceFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        getSourceFiles(filePath, fileList);
      } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
        fileList.push(filePath);
      }
    }
    return fileList;
  }

  it('1. should verify 0 native alert(), confirm(), prompt() calls remain in frontend/src', () => {
    const allFiles = getSourceFiles(frontendSrcDir);
    const nativeCallPattern = /\b(alert|confirm|prompt)\s*\(/;
    const windowCallPattern = /window\.(alert|confirm|prompt)\s*\(/;

    const offendingLines = [];

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        const trimmed = line.trim();
        // Skip comment lines
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
          return;
        }

        if (nativeCallPattern.test(line) || windowCallPattern.test(line)) {
          offendingLines.push({
            file: path.relative(frontendSrcDir, file),
            line: index + 1,
            content: trimmed,
          });
        }
      });
    }

    expect(
      offendingLines,
      `Found native browser dialog calls:\n${JSON.stringify(offendingLines, null, 2)}`
    ).toEqual([]);
  });

  it('2. should verify reusable modal components are properly defined and exported', async () => {
    const commonIndex = await import('../../frontend/src/components/common/index.js');

    expect(commonIndex.Modal).toBeDefined();
    expect(commonIndex.ConfirmModal).toBeDefined();
    expect(commonIndex.ConfirmDialog).toBeDefined();
    expect(commonIndex.FeedbackModal).toBeDefined();
    expect(commonIndex.SuccessModal).toBeDefined();
    expect(commonIndex.ErrorModal).toBeDefined();
    expect(commonIndex.WarningModal).toBeDefined();
    expect(commonIndex.InfoModal).toBeDefined();
  });

  it('3. should verify SLA Monitor scan uses professional custom success modal matching requirements', () => {
    const slaFile = path.join(frontendSrcDir, 'pages/manager/SLAManagement.jsx');
    const content = fs.readFileSync(slaFile, 'utf-8');

    // Title: SLA Scan Completed
    expect(content).toContain("title: 'SLA Scan Completed'");
    // Message: The SLA monitoring scan has finished successfully.
    expect(content).toContain("message: 'The SLA monitoring scan has finished successfully.'");
    // Status: Completed
    expect(content).toContain("status: 'Completed'");
    // Button: Got it
    expect(content).toContain("buttonText: 'Got it'");

    // Error handling with showError
    expect(content).toContain("showError(");
    expect(content).not.toContain("alert(`SLA Monitor Scan");
  });

  it('4. should verify critical actions require explicit confirmation modals', () => {
    // TicketDetail: Close ticket and delete attachment confirmation
    const ticketDetailFile = path.join(frontendSrcDir, 'pages/tickets/TicketDetail.jsx');
    const ticketDetailContent = fs.readFileSync(ticketDetailFile, 'utf-8');
    expect(ticketDetailContent).toContain("title: 'Close Ticket'");
    expect(ticketDetailContent).toContain("title: 'Delete Attachment'");
    expect(ticketDetailContent).toContain('handleDeleteAttachment');

    // TeamManagement: Delete team confirmation
    const teamFile = path.join(frontendSrcDir, 'pages/manager/TeamManagement.jsx');
    const teamContent = fs.readFileSync(teamFile, 'utf-8');
    expect(teamContent).toContain('handleDeleteTeam');
    expect(teamContent).toContain('showConfirm({');
    expect(teamContent).toContain('Delete Team');

    // UserManagement: Deactivate user confirmation
    const userFile = path.join(frontendSrcDir, 'pages/admin/UserManagement.jsx');
    const userContent = fs.readFileSync(userFile, 'utf-8');
    expect(userContent).toContain('Deactivate User');
    expect(userContent).toContain('showConfirm({');
  });

  it('5. should verify accessibility attributes and dark navy styling in modal components', () => {
    const feedbackModalFile = path.join(frontendSrcDir, 'components/common/FeedbackModal.jsx');
    const feedbackContent = fs.readFileSync(feedbackModalFile, 'utf-8');

    // ARIA attributes
    expect(feedbackContent).toContain('role="dialog"');
    expect(feedbackContent).toContain('aria-modal="true"');
    expect(feedbackContent).toContain('aria-labelledby="feedback-modal-title"');
    expect(feedbackContent).toContain('aria-describedby="feedback-modal-message"');

    // Keyboard & Escape
    expect(feedbackContent).toContain("e.key === 'Escape'");
    expect(feedbackContent).toContain('.focus()');

    // Dark navy styling
    expect(feedbackContent).toContain('dark:bg-navy-900');
    expect(feedbackContent).toContain('dark:border-navy-750');

    // ConfirmModal check
    const confirmModalFile = path.join(frontendSrcDir, 'components/common/ConfirmModal.jsx');
    const confirmContent = fs.readFileSync(confirmModalFile, 'utf-8');
    expect(confirmContent).toContain('role="dialog"');
    expect(confirmContent).toContain('aria-modal="true"');
    expect(confirmContent).toContain("e.key === 'Escape'");
    expect(confirmContent).toContain('dark:bg-navy-900');
  });

  it('6. should verify ModalProvider is mounted in App.jsx and exports useModal hook', () => {
    const appFile = path.join(frontendSrcDir, 'App.jsx');
    const appContent = fs.readFileSync(appFile, 'utf-8');
    expect(appContent).toContain('<ModalProvider>');
    expect(appContent).toContain('</ModalProvider>');

    const contextFile = path.join(frontendSrcDir, 'contexts/ModalContext.jsx');
    const contextContent = fs.readFileSync(contextFile, 'utf-8');
    expect(contextContent).toContain('showSuccess');
    expect(contextContent).toContain('showError');
    expect(contextContent).toContain('showWarning');
    expect(contextContent).toContain('showInfo');
    expect(contextContent).toContain('showConfirm');
  });
});
