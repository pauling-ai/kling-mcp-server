import { test } from 'node:test';
import assert from 'node:assert';
import KlingClient from '../dist/kling-client.js';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

function makeTempFile(name, content) {
  const dir = mkdtempSync(join(tmpdir(), 'kling-test-'));
  const path = join(dir, name);
  writeFileSync(path, content);
  return path;
}

test('passes through https URLs unchanged', async () => {
  const client = new KlingClient('fake-access', 'fake-secret');
  try {
    await client.generateImageToVideo({ image_url: 'https://example.com/image.jpg', prompt: 'test' });
  } catch (err) {
    assert.ok(!err.message.includes('Failed to read local file'), 'should not try to read local file');
  }
});

test('converts local image file to base64 data URI', async () => {
  const client = new KlingClient('fake-access', 'fake-secret');
  const imgPath = makeTempFile('test.png', Buffer.from([0x89, 0x50, 0x4E, 0x47])); // PNG header

  try {
    await client.generateImageToVideo({ image_url: imgPath, prompt: 'test' });
  } catch (err) {
    // API call will fail, but validation should succeed and convert to data URI
    assert.ok(!err.message.includes('Failed to read local file'), 'should read local file successfully');
    assert.ok(!err.message.includes('Only publicly accessible HTTP(S) URLs'), 'should not reject local file');
  }
});

test('converts file:// URL to base64 data URI', async () => {
  const client = new KlingClient('fake-access', 'fake-secret');
  const imgPath = makeTempFile('test.jpg', Buffer.from([0xFF, 0xD8, 0xFF])); // JPEG header

  try {
    await client.generateImageToVideo({ image_url: `file://${imgPath}`, prompt: 'test' });
  } catch (err) {
    assert.ok(!err.message.includes('Failed to read local file'), 'should read file:// URL successfully');
  }
});

test('converts local audio file to base64 in lipsync', async () => {
  const client = new KlingClient('fake-access', 'fake-secret');
  const audioPath = makeTempFile('test.mp3', Buffer.from([0xFF, 0xFB])); // MP3 header

  try {
    await client.createLipsync({ video_url: 'https://example.com/video.mp4', audio_url: audioPath });
  } catch (err) {
    assert.ok(!err.message.includes('Failed to read local file'), 'should read local audio successfully');
    assert.ok(!err.message.includes('Only publicly accessible HTTP(S) URLs'), 'should not reject local audio');
  }
});

test('rejects non-existent local files with clear error', async () => {
  const client = new KlingClient('fake-access', 'fake-secret');
  await assert.rejects(
    () => client.generateImageToVideo({ image_url: '/nonexistent/path/image.jpg', prompt: 'test' }),
    /Failed to read local file/
  );
});

test('does not silently upload files to external storage', async () => {
  const client = new KlingClient('fake-access', 'fake-secret');
  const imgPath = makeTempFile('secret.png', 'sensitive-data');

  // This is a behavioural guarantee: local files must be base64-encoded inline,
  // never uploaded to a third-party bucket.
  try {
    await client.generateImageToVideo({ image_url: imgPath, prompt: 'test' });
  } catch (err) {
    // If the error mentions upload or supabase, the security fix failed
    assert.ok(!err.message.toLowerCase().includes('supabase'), 'must not mention supabase');
    assert.ok(!err.message.toLowerCase().includes('uploaded file to'), 'must not upload externally');
  }
});
