import { renderTransactionalEmail } from './transactional-email.template';

describe('renderTransactionalEmail', () => {
  it('escapes untrusted recipient and message content', () => {
    const result = renderTransactionalEmail({
      title: 'Access <approved>',
      message: '<script>alert("x")</script>',
      recipientName: 'Ada & Sons',
    });

    expect(result.html).toContain('Ada &amp; Sons');
    expect(result.html).toContain('Access &lt;approved&gt;');
    expect(result.html).not.toContain('<script>');
  });

  it('omits a CTA when its URL is not HTTP or HTTPS', () => {
    const result = renderTransactionalEmail({
      title: 'Important update',
      message: 'Review your account.',
      actionUrl: 'javascript:alert(1)',
      actionLabel: 'Open account',
    });

    expect(result.html).not.toContain('javascript:');
    expect(result.text).not.toContain('javascript:');
    expect(result.html).not.toContain('Open account');
  });
});
