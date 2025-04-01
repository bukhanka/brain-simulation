import { NextResponse } from 'next/server';
import { 
  AgentRole, 
  generateCode, 
  generateEvent, 
  getAgentThoughts,
  generateComplexCode,
  planProject,
  generateModules,
  reviewCode,
  testCode
} from '@/lib/api/openai';
import { handleApiError, validateApiKey } from '@/lib/api/utils';
import { CodeReviewResult, TestResult, FileModule } from '@/hooks/use-brain-api';

export async function POST(request: Request) {
  try {
    // Validate API key first
    if (!validateApiKey()) {
      return NextResponse.json(
        { error: 'OpenAI API key is missing or invalid. Please check your .env.local file.' }, 
        { status: 500 }
      );
    }

    const requestData = await request.json();
    const { action } = requestData;
    
    switch (action) {
      case 'getThoughts': {
        const { agent, task } = requestData;
        if (!agent || typeof agent !== 'string') {
          return NextResponse.json({ error: 'Agent is required' }, { status: 400 });
        }
        const thought = await getAgentThoughts(agent as AgentRole, task || 'Неизвестная задача');
        return NextResponse.json({ thought });
      }
        
      case 'generateCode': {
        const { task, context = [] } = requestData;
        if (!task || typeof task !== 'string') {
          return NextResponse.json({ error: 'Task is required' }, { status: 400 });
        }
        const code = await generateCode(task, context);
        return NextResponse.json({ code });
      }
      
      case 'generateComplexCode': {
        const { task, context = [], projectStructure } = requestData;
        if (!task || typeof task !== 'string') {
          return NextResponse.json({ error: 'Task is required' }, { status: 400 });
        }
        if (!projectStructure || typeof projectStructure !== 'string') {
          return NextResponse.json({ error: 'Project structure is required' }, { status: 400 });
        }
        const result = await generateComplexCode(task, context, projectStructure);
        return NextResponse.json(result);
      }
      
      case 'planProject': {
        const { specification } = requestData;
        if (!specification || typeof specification !== 'string') {
          return NextResponse.json({ error: 'Project specification is required' }, { status: 400 });
        }
        const files = await planProject(specification);
        return NextResponse.json({ files });
      }
      
      case 'generateModules': {
        const { specification, fileStructure, context = [] } = requestData;
        if (!specification || typeof specification !== 'string') {
          return NextResponse.json({ error: 'Project specification is required' }, { status: 400 });
        }
        if (!fileStructure || !Array.isArray(fileStructure)) {
          return NextResponse.json({ error: 'File structure is required and must be an array' }, { status: 400 });
        }
        const modules = await generateModules(specification, fileStructure, context);
        return NextResponse.json({ modules });
      }
      
      case 'reviewCode': {
        const { code, requirements, context = [] } = requestData;
        if (!code || typeof code !== 'string') {
          return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }
        if (!requirements || typeof requirements !== 'string') {
          return NextResponse.json({ error: 'Requirements are required' }, { status: 400 });
        }
        const review = await reviewCode(code, requirements, context);
        return NextResponse.json(review);
      }
      
      case 'testCode': {
        const { code, testCases } = requestData;
        if (!code || typeof code !== 'string') {
          return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }
        if (!testCases || !Array.isArray(testCases)) {
          return NextResponse.json({ error: 'Test cases are required and must be an array' }, { status: 400 });
        }
        const testResult = await testCode(code, testCases);
        return NextResponse.json(testResult);
      }
        
      case 'generateEvent': {
        const event = await generateEvent();
        return NextResponse.json({ event });
      }
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in brain API:', error);
    const errorMessage = handleApiError(error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 