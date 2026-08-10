export const EMAIL_NOTIFICATION_JOB = 'email.notification.send';

export const EMAIL_NOTIFICATION_QUEUE = 'email-notification';

export interface EmailNotificationJobPayload {
  notificationId: string;
  tenantId: string;
  recipient: string;
  subject: string;
  content: string;
}
