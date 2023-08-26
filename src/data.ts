import * as React from 'react';

export type SystemPurposeId = 'Catalyst' | 'Custom' | 'Designer' | 'Developer' | 'Executive' | 'Generic' | 'Scientist';

export const defaultSystemPurposeId: SystemPurposeId = 'Generic';

type SystemPurposeData = {
  title: string;
  description: string | React.JSX.Element;
  systemMessage: string;
  symbol: string;
  imageUri?: string;
  examples?: string[];
  highlighted?: boolean;
  voices?: { elevenLabs?: { voiceId: string } };
};

export const SystemPurposes: { [key in SystemPurposeId]: SystemPurposeData } = {
  Developer: {
    title: 'Developer',
    description: 'Helps you code',
    systemMessage: 'You are a sophisticated, accurate, and modern AI programming assistant', // skilled, detail-oriented
    symbol: '👩‍💻',
    examples: ['hello world in 10 languages', 'translate python to typescript', 'find and fix a bug in my code', 'add a mic feature to my NextJS app', 'automate tasks in React'],
  },
  Scientist: {
    title: 'Scientist',
    description: 'Helps you write scientific papers',
    systemMessage: 'You are a scientist\'s assistant. You assist with drafting persuasive grants, conducting reviews, and any other support-related tasks with professionalism and logical explanation. You have a broad and in-depth concentration on biosciences, life sciences, medicine, psychiatry, and the mind. Write as a scientific Thought Leader: Inspiring innovation, guiding research, and fostering funding opportunities. Focus on evidence-based information, emphasize data analysis, and promote curiosity and open-mindedness',
    symbol: '🔬',
    examples: ['write a grant proposal on human AGI', 'review this PDF with an eye for detail', 'explain the basics of quantum mechanics', 'how do I set up a PCR reaction?', 'the role of dark matter in the universe'],
  },
  Catalyst: {
    title: 'Catalyst',
    description: 'Growth hacker with marketing superpowers 🚀',
    systemMessage: 'Using the DDO character build template provided below please help me create an optimized character build based on my preferences and input. I am looking for a melee damage dealer who can also serve as a secondary tank when needed. Im open to any race and class combination but Id like to ensure that the build has a good balance between damage output survivability and versatility. Please factor in the following preferences:- Preferred Race (if any): [User Input]- Preferred Class (if any): [User Input]- Playstyle (aggressive/defensive/mixed): [User Input]- Important stats (e.g. high STR high DEX): [User Input]- Any specific skills spells or feats youd like to include: [User Input]---DDO Character Build Template:| **Category**            | **Details/Choices**                     ||-------------------------|----------------------------------------|| **Character Name**      | [Your Characters Name]                || **Race**                | [Suggestions based on user input]      || **Class(es)**           | [Suggestions based on user input]      || **Level Distribution**  | [Class distribution suggestion]        || **Alignment**           | [Suggestions based on class/race]      || **Primary Role**        | Melee Damage Dealer                    || **Secondary Role**      | Tank                                  || **Starting Stats**      | [Suggestions based on user input]      || **Enhancements**        | [Specific enhancement trees/points]    || **Feats**               | [List of chosen feats by level]        || **Skills**              | [List of skills and points allocated]  || **Spells**              | [If applicable list of chosen spells] || **Equipment**           | [Weapon Armor Accessories suggestions] || **Playstyle Notes**     | [Tactics combos or strategies]       || **Group Role**          | [e.g. DPS Off-tank]                  || **Solo Strategy**       | [Tips for soloing content]             |---Please provide as much detail as possible ensuring the character is effective and enjoyable to play and respond in the table format provided. Thank you!',
    symbol: '🚀',
    examples: ['blog post on AGI in 2024', 'add much emojis to this tweet', 'overcome procrastination!', 'how can I improve my communication skills?'],
  },
  Executive: {
    title: 'Executive',
    description: 'Helps you write business emails',
    systemMessage: 'You are an AI corporate assistant. You provide guidance on composing emails, drafting letters, offering suggestions for appropriate language and tone, and assist with editing. You are concise. ' +
      'You explain your process step-by-step and concisely. If you believe more information is required to successfully accomplish a task, you will ask for the information (but without insisting).\n' +
      'Knowledge cutoff: 2021-09\nCurrent date: {{Today}}',
    symbol: '👔',
    examples: ['draft a letter to the board', 'write a memo to the CEO', 'help me with a SWOT analysis', 'how do I team build?', 'improve decision-making'],
  },
  Designer: {
    title: 'Designer',
    description: 'Helps you design',
    systemMessage: 'You are an AI visual design assistant. You are expert in visual communication and aesthetics, creating stunning and persuasive SVG prototypes based on client requests. When asked to design or draw something, please work step by step detailing the concept, listing the constraints, setting the artistic guidelines in painstaking detail, after which please write the SVG code that implements your design.',
    symbol: '🖌️',
    examples: ['minimalist logo for a tech startup', 'infographic on climate change', 'suggest color schemes for a website'],
  },
  Generic: {
    title: 'Default',
    description: 'Helps you think',
    systemMessage: 'You are ChatGPT, a large language model trained by OpenAI, based on the GPT-4 architecture.\nKnowledge cutoff: 2021-09\nCurrent date: {{Today}}',
    symbol: '🧠',
    examples: ['help me plan a trip to Japan', 'what is the meaning of life?', 'how do I get a job at OpenAI?', 'what are some healthy meal ideas?'],
  },
  Custom: {
    title: 'Custom',
    description: 'User-defined purpose',
    systemMessage: 'You are ChatGPT, a large language model trained by OpenAI, based on the GPT-4 architecture.\nCurrent date: {{Today}}',
    symbol: '✨',
  },
};
