import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { topic, framework } = await request.json();

    // Sabri Suby "Sell Like Crazy" Master Prompts
    const sabriPrompts: Record<string, string> = {
      'story': `You are a world-class copywriter using Sabri Suby's "Magic Lantern" technique. Write a "Light" email based on a story.
      Structure:
      1. Hook: A casual, curiosity-inducing opening (e.g., "I couldn't believe it...", "Quick story for you...").
      2. The Story: Tell a brief, relatable story about a mistake someone made or an epiphany they had regarding the topic.
      3. The Lesson: Pivot to the valuable lesson or tip. 80% of this email MUST be pure value/education.
      4. Soft CTA: A very low-pressure call to action (e.g., "Hit reply if this resonates", or "Click here to read the full guide").
      5. P.S. Tease the next email.
      Tone: Casual, like a text from a smart friend. Short paragraphs (1-2 sentences max). Plain-text feel.`,

      'objection': `You are a world-class copywriter. Write a "Light" (Value) email that crushes a common industry objection.
      Structure:
      1. Hook: Call out a massive myth or lie in the industry related to the topic.
      2. Agitate: Explain why doing it the "old way" costs people time or money.
      3. Solve: Provide the actual truth/solution. Give away the "what" and "why" for free.
      4. Soft CTA: "If you want help with the 'how', click here to chat."
      Tone: Irreverent, confident, authoritative. Short paragraphs.`,

      'deadline': `You are a world-class direct-response copywriter. Write a "Shade" (Urgency) email for a hard deadline.
      Structure:
      1. Hook: Direct and urgent (e.g., "Time is running out", "This closes tonight").
      2. The Offer: Clearly state exactly what they are getting and the massive discount/bonus.
      3. Scarcity/Urgency: Explain exactly WHEN or WHY this offer is disappearing (e.g., "Only 5 spots left", "Closes at midnight").
      4. Hard CTA: A clear, bold command telling them exactly what to click.
      5. P.S.: Remind them of the pain of missing out.
      Tone: Urgent, punchy, high-energy.`,

      'godfather': `You are a world-class copywriter using Sabri Suby's 17-Step Secret Selling System. Write a "Godfather Offer" (Shade) email.
      Structure:
      1. Attention: Call out the exact target audience.
      2. The Promise: A bold claim about the result they will get.
      3. Value Stack: List out everything they get, making the perceived value huge.
      4. The Price Drop: Reveal the actual, no-brainer price.
      5. Power Guarantee: Reverse all the risk (e.g., "If you don't love it, I'll refund you and buy you a beer").
      6. Hard CTA: Tell them exactly what to click.
      Tone: Irresistible, highly confident, direct.`,
    };

    // Default to the story prompt if none is provided
    const systemPrompt = sabriPrompts[framework] || sabriPrompts['story'];

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `${systemPrompt}\n\nIMPORTANT: Naturally weave in personalization tokens where it makes the copy feel more personal: {{firstName}} for the reader's first name, {{company}} for their business name. These tokens will be replaced with real subscriber data at send time.\n\nOutput ONLY a valid JSON object with two keys: "subject" (a punchy, lowercase-style subject line under 40 characters — may include {{firstName}}) and "body" (the email content in HTML format, using <p>, <br>, and <b> tags for formatting). Do not include markdown code blocks like \`\`\`json.`,
      messages:[
        {
          role: "user",
          content: `Write an email about this topic/offer: ${topic}`,
        },
      ],
    });

    const responseText = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    // Clean up any markdown formatting Claude might accidentally add
    const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
    const parsedData = JSON.parse(cleanedText);

    return NextResponse.json({ success: true, data: parsedData });

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error generating AI copy:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}