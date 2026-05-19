import { test } from 'node:test';
import assert from 'node:assert';
import KlingClient from '../dist/kling-client.js';

test('rejects local file paths in image-to-video', async () => {
  const client = new KlingClient('fake-access', 'fake-secret');
  await assert.rejects(
    () => client.generateImageToVideo({ image_url: '/etc/passwd', prompt: 'test' }),
    /Only publicly accessible HTTP\(S\) URLs are supported/
  );
});

test('rejects file:// URLs in image-to-video', async () => {
  const client = new KlingClient('fake-access', 'fake-secret');
  await assert.rejects(
    () => client.generateImageToVideo({ image_url: 'file:///etc/passwd', prompt: 'test' }),
    /Only publicly accessible HTTP\(S\) URLs are supported/
  );
});

test('rejects local file paths in lipsync video_url', async () => {
  const client = new KlingClient('fake-access', 'fake-secret');
  await assert.rejects(
    () => client.createLipsync({ video_url: '/tmp/video.mp4', tts_text: 'hello' }),
    /Only publicly accessible HTTP\(S\) URLs are supported/
  );
});

test('rejects local file paths in virtual try-on', async () => {
  const client = new KlingClient('fake-access', 'fake-secret');
  await assert.rejects(
    () => client.virtualTryOn({ person_image_url: '/tmp/me.jpg', cloth_image_urls: ['https://example.com/dress.jpg'] }),
    /Only publicly accessible HTTP\(S\) URLs are supported/
  );
});

test('rejects local file paths in video effects', async () => {
  const client = new KlingClient('fake-access', 'fake-secret');
  await assert.rejects(
    () => client.applyVideoEffect({ image_urls: ['/tmp/img.jpg'], effect_scene: 'squish' }),
    /Only publicly accessible HTTP\(S\) URLs are supported/
  );
});

test('accepts https URLs without validation error', async () => {
  const client = new KlingClient('fake-access', 'fake-secret');
  try {
    await client.generateImageToVideo({ image_url: 'https://example.com/image.jpg', prompt: 'test' });
  } catch (err) {
    assert.ok(!err.message.includes('Only publicly accessible HTTP(S) URLs'), 'should not be a URL validation error');
  }
});
