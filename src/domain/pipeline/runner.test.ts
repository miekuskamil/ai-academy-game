import { describe, expect, it } from 'vitest';
import { PipelineRunner, runCheck, fillPrompt } from './PipelineRunner';
import { themeById } from './blocks';
import type { IAIProvider } from '../ai/IAIProvider';

const toys = themeById('toys');

class FakeModel implements IAIProvider {
  constructor(private readonly reply: (msg: string) => string) {}
  capabilities() {
    return { available: true, label: 'Fake' };
  }
  async complete(messages: { role: string; content: string }[]) {
    return this.reply(messages[0]!.content);
  }
}

class OffModel implements IAIProvider {
  capabilities() {
    return { available: false, label: 'Off' };
  }
  async complete(): Promise<string> {
    throw new Error('off');
  }
}

describe('fillPrompt', () => {
  it('drops the item into the template', () => {
    expect(fillPrompt('Describe the {item}, briefly.', 'red car')).toBe('Describe the red car, briefly.');
  });
});

describe('runCheck', () => {
  it('passes a real, on-topic, sensible-length blurb', () => {
    const { passed } = runCheck('This teddy is soft and very well loved.', 'teddy');
    expect(passed).toBe(true);
  });

  it('fails something too short', () => {
    expect(runCheck('nice', 'teddy').passed).toBe(false);
  });

  it('fails a blurb that never mentions the item', () => {
    const { passed, note } = runCheck('A wonderful thing, truly delightful to behold.', 'teddy');
    expect(passed).toBe(false);
    expect(note).toMatch(/never mentions/i);
  });
});

describe('PipelineRunner live', () => {
  it('sends her prompt to the model and checks each answer', async () => {
    const model = new FakeModel((msg) => `Here is ${msg.split('the ')[1] ?? 'it'} — soft and lovely.`);
    const runner = new PipelineRunner(model);
    const result = await runner.run({
      brief: toys.brief,
      prompt: 'Write a blurb about the {item}.',
      items: ['teddy', 'robot'],
      theme: toys,
    });
    expect(result.live).toBe(true);
    expect(result.items).toHaveLength(2);
    expect(result.items.every((i) => !i.recorded)).toBe(true);
  });

  it('marks an answer failed when the checker rejects it', async () => {
    const runner = new PipelineRunner(new FakeModel(() => 'no'));
    const result = await runner.run({
      brief: toys.brief,
      prompt: 'x {item}',
      items: ['teddy'],
      theme: toys,
    });
    expect(result.items[0]!.passed).toBe(false);
  });
});

describe('PipelineRunner with no model', () => {
  it('plays a recorded demo, clearly labelled as recorded', async () => {
    const runner = new PipelineRunner(new OffModel());
    const result = await runner.run({
      brief: toys.brief,
      prompt: 'anything {item}',
      items: ['teddy', 'robot'],
      theme: toys,
    });
    expect(result.live).toBe(false);
    expect(result.items.every((i) => i.recorded)).toBe(true);
    // The demo still produces real, checkable output.
    expect(result.items[0]!.output.length).toBeGreaterThan(8);
  });

  it('lets the demo show the checker catching a bad answer', async () => {
    const runner = new PipelineRunner(new OffModel());
    const result = await runner.run({
      brief: toys.brief,
      prompt: 'p {item}',
      items: ['(demo-fail) teddy'],
      theme: toys,
    });
    expect(result.items[0]!.passed).toBe(false);
  });
});
