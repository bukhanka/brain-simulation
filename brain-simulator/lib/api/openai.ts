import OpenAI from 'openai';
import { validateApiKey } from './utils';
import { CodeReviewResult, TestResult, FileModule } from '@/hooks/use-brain-api';

// Initialize the OpenAI client with a fallback for development
const apiKey = process.env.OPENAI_API_KEY || 'sk-dummy-key-for-development-only';

// Initialize the OpenAI client with proxy configuration
export const openai = new OpenAI({
  apiKey,
  dangerouslyAllowBrowser: true, // Enable client-side usage (use with caution)
  baseURL: process.env.OPENAI_PROXY_URL || undefined, // Optional proxy URL
});

export type AgentRole = 'planner' | 'coder' | 'procrastinator' | 'critic' | 'researcher' | 'focus';

// Define agent personas that will be used for LLM prompting
export const agentPersonas: Record<AgentRole, string> = {
  planner: "Ты - Планировщик, тебе нужно разбить задачу на логические шаги. Ты немного ленив, но стараешься структурировать работу.",
  coder: "Ты - Кодер, ты пишешь код и решаешь технические проблемы. Ты часто сомневаешься, но в итоге находишь решение.",
  procrastinator: "Ты - Прокрастинатор, ты придумываешь оправдания, чтобы не работать. Ты любишь отвлекаться на YouTube и социальные сети.",
  critic: "Ты - Критик, ты анализируешь код и находишь проблемы. Ты всегда видишь способы улучшения и не стесняешься об этом говорить.",
  researcher: "Ты - Исследователь, ты ищешь информацию и изучаешь документацию. Ты любишь глубоко погружаться в детали.",
  focus: "Ты - Фокус, ты помогаешь сконцентрироваться на задаче. Ты мотивируешь и устраняешь отвлекающие факторы."
};

// Get thoughts from the LLM based on the agent persona
export async function getAgentThoughts(
  agent: AgentRole, 
  currentTask: string
): Promise<string> {
  try {
    // Check if we have a valid API key before making requests
    if (!validateApiKey()) {
      return `Нужен API ключ для доступа к мозгу ${agent}...`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using the mini model for efficiency
      messages: [
        {
          role: "system",
          content: `${agentPersonas[agent]} Ты сейчас работаешь над задачей: "${currentTask}". Напиши короткую мысль (не более 100 символов), которая отражает твой подход к этой задаче.`
        }
      ],
      max_tokens: 60,
    });

    return response.choices[0]?.message?.content || "Хм...";
  } catch (error) {
    console.error("Error getting agent thoughts:", error);
    return "Ошибка подключения к мозгу...";
  }
}

// Enhanced code generation with context
export async function generateCode(task: string, context: string[] = []): Promise<string> {
  try {
    // Check if we have a valid API key before making requests
    if (!validateApiKey()) {
      return "// Нужен валидный OpenAI API ключ для генерации кода\n// Добавьте его в .env.local файл";
    }

    // Process context into a summarized form
    const contextSummary = context.length > 0 
      ? `Контекст предыдущего взаимодействия:\n${context.slice(-5).join('\n')}`
      : '';

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ты - эксперт по программированию. Напиши код для решения поставленной задачи. Используй современные практики и включи комментарии."
        },
        {
          role: "user",
          content: `Задача: ${task}\n\n${contextSummary}`
        }
      ],
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || "// Код не сгенерирован";
  } catch (error) {
    console.error("Error generating code:", error);
    return "// Ошибка генерации кода";
  }
}

// Generate complex code with awareness of project structure
export async function generateComplexCode(
  task: string, 
  context: string[] = [], 
  projectStructure: string
): Promise<{ code: string, explanation: string }> {
  try {
    if (!validateApiKey()) {
      return { 
        code: "// Нужен валидный OpenAI API ключ для генерации кода", 
        explanation: "API ключ отсутствует" 
      };
    }

    const contextSummary = context.length > 0 
      ? `Контекст предыдущего взаимодействия:\n${context.slice(-5).join('\n')}`
      : '';

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ты - старший разработчик и архитектор ПО. Твоя задача - написать качественный код с учетом структуры существующего проекта. Код должен быть оптимальным, хорошо документированным и соответствовать современным стандартам."
        },
        {
          role: "user",
          content: `Задача: ${task}\n\nСтруктура проекта:\n${projectStructure}\n\n${contextSummary}`
        }
      ],
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || "// Код не сгенерирован";
    
    // Split the response into code and explanation
    const codeMatch = content.match(/```(?:javascript|typescript|js|ts)?\s*([\s\S]*?)\s*```/);
    const code = codeMatch ? codeMatch[1] : content;
    
    let explanation = content.replace(/```(?:javascript|typescript|js|ts)?\s*[\s\S]*?\s*```/, '').trim();
    if (!explanation) {
      explanation = "Объяснение не предоставлено";
    }

    return { code, explanation };
  } catch (error) {
    console.error("Error generating complex code:", error);
    return { 
      code: "// Ошибка генерации кода", 
      explanation: error instanceof Error ? error.message : "Неизвестная ошибка" 
    };
  }
}

// Plan project file structure
export async function planProject(specification: string): Promise<string[]> {
  try {
    if (!validateApiKey()) {
      return ["// Нужен валидный OpenAI API ключ"];
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ты - опытный архитектор ПО. Твоя задача - спланировать структуру файлов для проекта на основе спецификации. Предложи только список файлов с их путями, без дополнительных объяснений."
        },
        {
          role: "user",
          content: `Спецификация проекта: ${specification}\n\nПредложи оптимальную структуру файлов для этого проекта.`
        }
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "";
    
    // Extract file paths from the response
    const fileRegex = /[a-zA-Z0-9_\-/.]+\.[a-zA-Z0-9]+/g;
    const files = content.match(fileRegex) || [];
    
    return files.length > 0 ? files : ["src/index.js", "src/app.js", "package.json"];
  } catch (error) {
    console.error("Error planning project:", error);
    return ["src/index.js", "src/app.js", "package.json"];
  }
}

// Generate multiple code modules
export async function generateModules(
  specification: string, 
  fileStructure: string[], 
  context: string[] = []
): Promise<FileModule[]> {
  try {
    if (!validateApiKey()) {
      return [{ 
        path: "src/index.js", 
        content: "// Нужен валидный OpenAI API ключ" 
      }];
    }

    const contextSummary = context.length > 0 
      ? `Контекст предыдущего взаимодействия:\n${context.slice(-3).join('\n')}`
      : '';

    // Group files by their type to generate them more cohesively
    const fileGroups = fileStructure.reduce((acc, file) => {
      const ext = file.split('.').pop() || '';
      if (!acc[ext]) acc[ext] = [];
      acc[ext].push(file);
      return acc;
    }, {} as Record<string, string[]>);

    const modules: FileModule[] = [];

    // Generate each file group sequentially
    for (const [ext, files] of Object.entries(fileGroups)) {
      // For smaller projects, we can generate all files of the same type together
      if (files.length <= 3) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Ты - опытный разработчик ПО. Создай содержимое для ${files.length} файлов ${ext} на основе спецификации проекта. Для каждого файла четко укажи его путь в формате "# FILEPATH: путь_к_файлу", а затем содержимое файла. Используй современные практики программирования и учитывай взаимосвязи между файлами.`
            },
            {
              role: "user",
              content: `Спецификация проекта: ${specification}\n\nФайлы для создания:\n${files.join('\n')}\n\n${contextSummary}`
            }
          ],
          max_tokens: 4000,
        });

        const content = response.choices[0]?.message?.content || "";
        
        // Parse file contents from response
        const fileContentRegex = /# FILEPATH: ([^\n]+)\n([\s\S]*?)(?=# FILEPATH:|$)/g;
        let match;
        
        while ((match = fileContentRegex.exec(content)) !== null) {
          const [, path, fileContent] = match;
          modules.push({
            path: path.trim(),
            content: fileContent.trim()
          });
        }
      } else {
        // For larger projects, generate files one by one
        for (const file of files) {
          const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `Ты - опытный разработчик ПО. Создай содержимое для файла ${file} на основе спецификации проекта. Используй современные практики программирования и учитывай, что этот файл является частью более крупной структуры.`
              },
              {
                role: "user",
                content: `Спецификация проекта: ${specification}\n\nСтруктура проекта:\n${fileStructure.join('\n')}\n\nСоздай содержимое файла: ${file}\n\n${contextSummary}`
              }
            ],
            max_tokens: 2000,
          });

          const content = response.choices[0]?.message?.content || "";
          
          // Extract code from response (remove markdown code blocks if present)
          const codeMatch = content.match(/```(?:javascript|typescript|js|ts)?\s*([\s\S]*?)\s*```/);
          const fileContent = codeMatch ? codeMatch[1] : content;
          
          modules.push({
            path: file,
            content: fileContent.trim()
          });
        }
      }
    }

    return modules;
  } catch (error) {
    console.error("Error generating modules:", error);
    return [{ 
      path: "src/index.js", 
      content: "// Ошибка генерации модулей: " + (error instanceof Error ? error.message : "Неизвестная ошибка")
    }];
  }
}

// Code review system
export async function reviewCode(
  code: string, 
  requirements: string,
  context: string[] = []
): Promise<CodeReviewResult> {
  try {
    if (!validateApiKey()) {
      return { 
        passes: false, 
        issues: ["Нужен валидный OpenAI API ключ для анализа кода"], 
        suggestions: ["Добавьте API ключ в .env.local файл"] 
      };
    }

    const contextSummary = context.length > 0 
      ? `Контекст предыдущего взаимодействия:\n${context.slice(-3).join('\n')}`
      : '';

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ты - опытный ревьюер кода. Проведи анализ предоставленного кода на соответствие требованиям, найди проблемы и предложи улучшения. Твой ответ должен быть структурирован в формате JSON со следующими полями: passes (boolean), issues (массив строк), suggestions (массив строк)."
        },
        {
          role: "user",
          content: `Требования:\n${requirements}\n\nКод для анализа:\n\`\`\`\n${code}\n\`\`\`\n\n${contextSummary}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || "";
    
    try {
      const result = JSON.parse(content) as CodeReviewResult;
      return {
        passes: result.passes ?? false,
        issues: result.issues ?? ["Ошибка анализа"],
        suggestions: result.suggestions ?? ["Рекомендации недоступны"]
      };
    } catch (e) {
      console.error("Error parsing code review result:", e);
      return {
        passes: false,
        issues: ["Ошибка при разборе результатов анализа"],
        suggestions: ["Попробуйте упростить код для анализа"]
      };
    }
  } catch (error) {
    console.error("Error reviewing code:", error);
    return {
      passes: false,
      issues: ["Ошибка при выполнении ревью кода"],
      suggestions: ["Проверьте подключение к API"]
    };
  }
}

// Code testing system (simulated)
export async function testCode(code: string, testCases: string[]): Promise<TestResult> {
  try {
    if (!validateApiKey()) {
      return { 
        success: false, 
        results: [{ case: "API ключ", passed: false, output: "Ошибка: Нужен валидный OpenAI API ключ" }]
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Ты - система тестирования кода. Симулируй выполнение предоставленного кода с учетом тестовых сценариев. Определи, проходит ли код каждый тестовый сценарий, и опиши результаты выполнения. Твой ответ должен быть в формате JSON со следующими полями: success (boolean), results (массив объектов {case, passed, output})."
        },
        {
          role: "user",
          content: `Код для тестирования:\n\`\`\`\n${code}\n\`\`\`\n\nТестовые сценарии:\n${testCases.join('\n')}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || "";
    
    try {
      const result = JSON.parse(content) as TestResult;
      return {
        success: result.success ?? false,
        results: result.results ?? [{ case: "Общий результат", passed: false, output: "Ошибка при тестировании" }]
      };
    } catch (e) {
      console.error("Error parsing test result:", e);
      return {
        success: false,
        results: [{ case: "Ошибка анализа", passed: false, output: "Не удалось разобрать результаты тестирования" }]
      };
    }
  } catch (error) {
    console.error("Error testing code:", error);
    return {
      success: false,
      results: [{ 
        case: "Системная ошибка", 
        passed: false, 
        output: "Ошибка при выполнении тестов: " + (error instanceof Error ? error.message : "Неизвестная ошибка") 
      }]
    };
  }
}

// Generate random events related to programming
export async function generateEvent(): Promise<string> {
  try {
    // Check if we have a valid API key before making requests
    if (!validateApiKey()) {
      return "API ключ отсутствует, мозг в автономном режиме";
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Сгенерируй забавное, короткое сообщение (до 80 символов) о случайном событии, которое могло бы произойти во время программирования. Используй юмор и сарказм."
        }
      ],
      max_tokens: 40,
    });

    return response.choices[0]?.message?.content || "Что-то произошло...";
  } catch (error) {
    console.error("Error generating event:", error);
    return "Система: Непредвиденное событие";
  }
} 