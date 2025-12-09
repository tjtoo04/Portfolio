<script setup lang="ts">
import { useCommandHistoryStore } from '@/stores/commandHistory'
import { COMMAND_DESCRIPTIONS, Commands, type FileSystem } from '@/types'
import { TerminalPath } from '@/utils/TerminalPath'
import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

const historyStore = useCommandHistoryStore()
const termPrompt: string = '❯ '
const termCursor: string = '█'
const currentLine: Ref<string> = ref('')
const isBlinking: Ref<boolean> = ref(true)

const INITIAL_FS: FileSystem = {
  root: {
    name: '', // Root
    type: 'dir',
    children: {
      projects: {
        name: 'projects',
        type: 'dir',
        children: {
          CreatureCode: { name: 'CreatureCode', type: 'file', content: 'To be added' },
        },
      },
      'about-me.md': {
        name: 'about-me.md',
        type: 'file',
        content: 'Too Tze Jiat APU Student',
      },
    },
  },
}

const terminal = new TerminalPath(INITIAL_FS)
const currentPath = ref(terminal.getCurrentPath())

const handleKeyPress = (event: KeyboardEvent) => {
  const disabledKeys = ['Meta', 'Shift', 'Tab', 'ArrowRight', 'ArrowLeft', 'Control']
  // Disable shortcuts and prevent input into terminal
  if (disabledKeys.includes(event.key)) {
    event.preventDefault()
    return
  }

  // Disable shortcuts but allow input into terminal
  if (event.key == '/') {
    event.preventDefault()
  }

  if (event.key == 'Backspace') {
    currentLine.value = currentLine.value.slice(0, -1)
    return
  }

  // Traverse command history
  if (event.key == 'ArrowUp') {
    event.preventDefault()
    historyStore.traverseHistory('up')
    currentLine.value = historyStore.getHistory() || ''
    return
  } else if (event.key == 'ArrowDown') {
    event.preventDefault()
    historyStore.traverseHistory('down')
    currentLine.value = historyStore.getHistory() || ''
    return
  }

  if (event.key == 'Enter') {
    const mainTermContainer = document.querySelector('.main-terminal-container')
    if (!mainTermContainer) return

    // Get latest prompt copy
    const latestPromptDiv = mainTermContainer.lastChild
    if (!latestPromptDiv) return

    const copyDiv = latestPromptDiv.cloneNode()
    const copyChildren = latestPromptDiv.childNodes

    for (let index = 0; index < copyChildren.length; index++) {
      const element = copyChildren[index]
      if (!element) return

      const elementText = element.textContent
      const childClone = element.cloneNode()
      childClone.textContent = elementText

      copyDiv.appendChild(childClone)
    }

    // Delete cursor from prompt
    copyDiv.lastChild?.remove()

    // Get prompt value, save to history, then reset prompt
    const value = currentLine.value.split(' ')[0]
    const args = currentLine.value.split(' ').slice(1)
    historyStore.addHistory(currentLine.value)
    currentLine.value = ''

    // Insert before new prompt
    mainTermContainer.insertBefore(copyDiv, latestPromptDiv)

    // Perform function
    const result = runCommand(value!.trim(), args)

    const resultDiv = document.createElement('div')
    resultDiv.style.whiteSpace = 'pre-wrap'
    resultDiv.style.marginTop = '0.2rem'
    resultDiv.style.marginBottom = '0.2rem'
    resultDiv.textContent = result

    // Insert Result
    mainTermContainer.insertBefore(resultDiv, latestPromptDiv)

    return
  }

  currentLine.value += event.key
}

const isCommandEnum = (value: string): value is Commands => {
  return Object.values(Commands).includes(value as Commands)
}

const runCommand = (command: string, args: string[] = []): string => {
  if (!isCommandEnum(command))
    return 'Command not found. Type `help` or `?` for list of available commands.'

  if (command == Commands.CLEAR || command == Commands.CLS) {
    // Clear all children except last
    const mainTermContainer = document.querySelector('.main-terminal-container')
    if (!mainTermContainer) return 'Error'

    while (mainTermContainer.childNodes.length > 1) {
      const firstChild = mainTermContainer.firstChild
      if (!firstChild) return 'Error'

      mainTermContainer.removeChild(firstChild)
    }
    return ''
  } else if (command == Commands.HELP || command == Commands.QUESTION) {
    let commandsInfo = 'Available Commands:\n\n'

    for (const commandKey in COMMAND_DESCRIPTIONS) {
      const info = COMMAND_DESCRIPTIONS[commandKey as Commands]

      if (commandKey === Commands.CLS || commandKey === Commands.QUESTION) {
        continue
      }

      const aliasText = info.alias ? ` (Alias: ${info.alias})` : ''

      commandsInfo += `  ${commandKey}${aliasText}\n`
      commandsInfo += `  > ${info.description}\n\n`
    }

    return commandsInfo.trim()
  } else if (command == Commands.CD) {
    if (args.length < 1) return 'Path not provided'
    if (terminal.cd(args[0]!)) {
      currentPath.value = terminal.getCurrentPath()
      return ''
    } else {
      return 'Invalid Path'
    }
  } else if (command == Commands.LS) {
    return terminal.ls()
  }
  return ''
}

onMounted(() => {
  setTimeout(() => {
    document.querySelector('.main-terminal-container')?.classList.add('is-ready')
    document.addEventListener('keydown', handleKeyPress)
  }, 500)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyPress)
})
</script>

<template>
  <div class="main-terminal-container">
    <div>
      Welcome to my Termfolio (Terminal Portfolio)! Start by typing `help` or `?` to view the list
      of available commands.
    </div>
    <div class="term-prompt-div">
      <div class="prompt-text">{{ currentPath }} {{ termPrompt }}</div>
      <div class="input-text">{{ currentLine }}</div>
      <div :class="['cursor-block', { blinking: isBlinking }]">{{ termCursor }}</div>
    </div>
  </div>
</template>

<style scoped>
.main-terminal-container.is-ready {
  transform: scale(1);
}

.main-terminal-container {
  display: flex;
  flex-direction: column;
  background-color: black;
  border-radius: 1rem;
  width: 80dvw;
  height: 80dvh;
  padding: 1rem;
  font-family: monospace;

  position: relative;

  transition: transform 0.6s ease-out;

  transform: scale(0);
}

.term-prompt-div {
  display: flex;
  align-items: center;
  background-color: transparent;
}

.term-output {
  white-space: pre-wrap;
  margin-top: 0.5rem;
}

.input-text {
  margin-left: 0.5rem;
}

.cursor-block {
  margin-left: 0.1rem;
}

@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.blinking {
  animation: blink 1s steps(1, start) infinite;
}
</style>
