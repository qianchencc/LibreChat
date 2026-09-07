const nodemailer = require('nodemailer');

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

const savedEnv = { ...process.env };
const sendMail = jest.fn().mockResolvedValue({ messageId: 'template-test' });

const cases = [
  {
    template: 'verifyEmail.handlebars',
    payload: {
      appName: '尘Chat',
      name: '测试用户',
      verificationLink: 'https://libre.qianc.ltd/verify?token=verify-token',
      year: '2026',
    },
    heading: '验证您的邮箱',
    actionUrl: 'https://libre.qianc.ltd/verify?token=verify-token',
  },
  {
    template: 'requestPasswordReset.handlebars',
    payload: {
      appName: '尘Chat',
      name: '测试用户',
      link: 'https://libre.qianc.ltd/reset-password?token=reset-token',
      year: '2026',
    },
    heading: '重置账户密码',
    actionUrl: 'https://libre.qianc.ltd/reset-password?token=reset-token',
  },
  {
    template: 'passwordReset.handlebars',
    payload: { appName: '尘Chat', name: '测试用户', year: '2026' },
    heading: '密码已重置',
  },
  {
    template: 'inviteUser.handlebars',
    payload: {
      appName: '尘Chat',
      inviteLink: 'https://libre.qianc.ltd/register?token=invite-token',
      year: '2026',
    },
    heading: '邀请您加入尘Chat',
    actionUrl: 'https://libre.qianc.ltd/register?token=invite-token',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  process.env = { ...savedEnv };
  process.env.EMAIL_HOST = 'smtp.example.com';
  process.env.EMAIL_FROM = 'noreply@example.com';
  process.env.EMAIL_ASSET_BASE_URL = 'https://libre.qianc.ltd/assets/email/';
  delete process.env.MAILGUN_API_KEY;
  delete process.env.MAILGUN_DOMAIN;
  nodemailer.createTransport.mockReturnValue({ sendMail });
});

afterAll(() => {
  process.env = savedEnv;
});

describe.each(cases)('$template', ({ template, payload, heading, actionUrl }) => {
  it('renders the ChenChat transactional email contract', async () => {
    const sendEmail = require('../sendEmail');

    await sendEmail({
      email: 'user@example.com',
      subject: 'Test subject',
      payload,
      template,
    });

    const html = sendMail.mock.calls[0][0].html;
    expect(html).toMatch(/<html lang=['"]zh-CN['"]>/);
    expect(html).toContain(heading);
    expect(html).toContain('尘Chat');
    expect(html).toContain('https://libre.qianc.ltd/assets/email/auth-hero.jpg');
    expect(html).toContain('https://libre.qianc.ltd/assets/email/chenchat-wordmark.png');
    expect(html).not.toContain('#10a37f');
    expect(html).not.toContain('background-color: #212121');
    if (actionUrl) {
      expect(html).toContain(actionUrl.replaceAll('&', '&amp;'));
    }
  });
});

it('falls back to DOMAIN_CLIENT for the email asset base URL', async () => {
  delete process.env.EMAIL_ASSET_BASE_URL;
  process.env.DOMAIN_CLIENT = 'https://libre.qianc.ltd/';
  const sendEmail = require('../sendEmail');

  await sendEmail({
    email: 'user@example.com',
    subject: 'Test subject',
    payload: cases[2].payload,
    template: cases[2].template,
  });

  expect(sendMail.mock.calls[0][0].html).toContain(
    'https://libre.qianc.ltd/assets/email/chenchat-wordmark.png',
  );
});
