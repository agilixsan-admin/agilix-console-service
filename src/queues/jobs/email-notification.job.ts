export const EMAIL_NOTIFICATION_JOB = 'email.notification.send';

export const EMAIL_NOTIFICATION_QUEUE = 'email-notification';

export interface EmailAttachment {
  filename: string;
  content: string;
  encoding: string;
  contentType: string;
}

export interface EmailNotificationJobPayload {
  notificationId: string;
  tenantId: string;
  recipient: string;
  subject: string;
  content: string;
  attachments?: EmailAttachment[];
}
