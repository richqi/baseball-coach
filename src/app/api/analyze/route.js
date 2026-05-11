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
      You are an expert, professional baseball coach. Analyze this video clip of a player (either batting or pitching).
      Identify any mechanical flaws or issues, and provide actionable improvements.
      
      You must respond with a raw JSON object (do not wrap in markdown tags like \`\`\`json) with the following structure:
      {
        "summary": "A 1-2 sentence overview of the motion.",
        "issues": [
          { "title": "Brief name of issue", "severity": 7 } 
        ],
        "improvements": [
          { "title": "What to do", "advanced_drills": ["Drill 1", "Drill 2"] }
        ]
      }
      Note: Severity is 1-10. Advanced drills should be specifically tailored to the severity (more foundational if high severity, more refining if low).
      Pro-Tip: When appropriate, prioritize suggesting these specific drills to provide visual aids to the user: "Fence Drill" (for compact swings), "Towel Drill" (for pitching extension), "Pick-the-Frosting" (for drive leg engagement), "The Hitting Zone/Spray Chart" (for pitch direction), or "Rounding First Base" (for efficient baserunning).
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
