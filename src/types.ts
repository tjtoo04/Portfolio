export enum Commands {
  CLEAR = 'clear',
  CLS = 'cls',
  HELP = 'help',
  QUESTION = '?',
}

interface CommandInfo {
  description: string;
  alias?: Commands;
}

export const COMMAND_DESCRIPTIONS: Record<Commands, CommandInfo> = {
  [Commands.CLEAR]: {
    description: 'Clears the terminal screen of all previous output and commands.',
    alias: Commands.CLS
  },
  [Commands.CLS]: {
    description: 'Clears the terminal screen of all previous output and commands (alias for clear).',
    alias: Commands.CLEAR
  },
  [Commands.HELP]: {
    description: 'Displays a list of all available commands and their descriptions.',
    alias: Commands.QUESTION
  },
  [Commands.QUESTION]: {
    description: 'Displays a list of all available commands and their descriptions (alias for help).',
    alias: Commands.HELP
  }
};
