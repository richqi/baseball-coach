import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export async function POST(request) {
  let tempFilePath = null;

  try {
    const formData = await request.formData();
    const file = formData.get('video');

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }

    // Initialize Gemini SDK
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Save file temporarily
    const buffer = Buffer.from(await file.arrayBuffer());
    tempFilePath = join(tmpdir(), `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
    await writeFile(tempFilePath, buffer);

    console.log(`File saved temporarily at ${tempFilePath}`);

    // Upload to Gemini
    let uploadResult = await ai.files.upload({
      file: tempFilePath,
      mimeType: file.type || 'video/mp4',
    });

    console.log(`File uploaded to Gemini: ${uploadResult.name}, State: ${uploadResult.state}`);

    // Videos need to be processed before they can be analyzed
    while (uploadResult.state === 'PROCESSING') {
      console.log('Waiting for video to process...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      uploadResult = await ai.files.get({ name: uploadResult.name });
    }

    if (uploadResult.state === 'FAILED') {
      throw new Error('Video processing failed on Google servers.');
    }

    console.log(`File processed successfully. URI: ${uploadResult.uri}`);

    const prompt = `
      You are an expert professional baseball coach and biomechanics analyst. Analyze this video clip of a player (either batting or pitching).
      Provide a thorough mechanical assessment: identify strengths, detect flaws, and prescribe specific corrective drills.

      Respond with a raw JSON object (no markdown code fences) matching this exact structure:
      {
        "motion_type": "batting" or "pitching",
        "player_level_estimate": "beginner", "intermediate", or "advanced",
        "summary": "2-3 sentences covering what motion was performed, the player's general level, and the single most important takeaway.",
        "strengths": [
          { "title": "One thing the player does well" }
        ],
        "issues": [
          {
            "title": "Short name of the issue (3-6 words)",
            "description": "2-3 sentences: what exactly is wrong, why it hurts performance, and what it looks like in the video.",
            "severity": 7,
            "body_region": "lower_body", "upper_body", "arm_path", or "follow_through",
            "timestamp_hint": "approximate moment where the flaw is most visible, e.g. '0:01-0:03'"
          }
        ],
        "improvements": [
          {
            "title": "Corrective focus area (e.g. 'Improve Hip Drive')",
            "fixes_issue": "Exact title of the issue this addresses",
            "advanced_drills": ["Drill Name 1", "Drill Name 2"]
          }
        ]
      }

      Rules:
      - Severity is 1-10: 8-10 = fix immediately, 5-7 = important to work on, 1-4 = fine-tuning.
      - Return 2-4 strengths, 2-5 issues ordered by severity descending, and exactly one improvement per issue.
      - Each improvement must name 1-2 specific drills.
      - When relevant, prioritize these named drills which have visual aids in the app:
        "Fence Drill" (compact swing path), "Towel Drill" (pitching arm extension),
        "Pick-the-Frosting" (drive leg / back-hip engagement), "Hitting Zone/Spray Chart" (pitch location awareness),
        "Rounding First Base" (efficient baserunning).
      - For drills not in the above list, use real, well-known baseball coaching drill names.
    `;

    // Generate content
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          fileData: {
            fileUri: uploadResult.uri,
            mimeType: uploadResult.mimeType
          }
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const resultText = response.text;
    console.log("Raw Response:", resultText);
    
    const analysisData = JSON.parse(resultText);

    return NextResponse.json(analysisData);

  } catch (error) {
    console.error('Error during analysis:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze video' }, { status: 500 });
  } finally {
    // Cleanup temp file
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
        console.log(`Cleaned up temp file: ${tempFilePath}`);
      } catch (e) {
        console.error(`Failed to clean up temp file ${tempFilePath}:`, e);
      }
    }
  }
}
