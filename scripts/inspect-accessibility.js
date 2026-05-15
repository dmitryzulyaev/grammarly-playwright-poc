// @ts-check
const { spawn } = require('node:child_process');

const defaultProcesses = [
  'Grammarly Desktop',
  'Google Chrome',
  'Chromium'
];

const processNames = process.argv.slice(2);
const targets = processNames.length > 0 ? processNames : defaultProcesses;
const maxDepth = Number(process.env.AX_MAX_DEPTH || 8);

(async () => {
  for (const processName of targets) {
    console.log(`\n=== ${processName} ===`);

    try {
      const output = await inspectProcess(processName, maxDepth);
      console.log(output.trim() || '(no accessibility elements returned)');
    } catch (error) {
      console.error(String(error.message || error));
      process.exitCode = 1;
    }
  }
})();

/**
 * @param {string} processName
 * @param {number} depth
 */
async function inspectProcess(processName, depth) {
  const script = buildAppleScript(processName, depth);
  if (process.env.AX_PRINT_SCRIPT === 'true') {
    console.error(script);
  }

  return new Promise((resolve, reject) => {
    const child = spawn('/usr/bin/osascript', ['-'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      stdout += chunk;
    });

    child.stderr.on('data', chunk => {
      stderr += chunk;
    });

    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `osascript exited with code ${code}`));
        return;
      }

      resolve(stdout);
    });

    child.stdin.end(script);
  });
}

/**
 * @param {string} processName
 * @param {number} depth
 */
function buildAppleScript(processName, depth) {
  return `
set targetProcessName to ${toAppleScriptString(processName)}
set maxDepth to ${depth}

on indentText(depth)
  set spaces to ""
  repeat depth times
    set spaces to spaces & "  "
  end repeat
  return spaces
end indentText

on readAttribute(uiElement, attributeName)
  try
    set attributeValue to value of attribute (attributeName as text) of uiElement
    if attributeValue is missing value then return ""
    return attributeValue as text
  on error
    return ""
  end try
end readAttribute

on describeElement(uiElement, currentDepth, maxDepth)
  if currentDepth > maxDepth then return ""

  set roleText to my readAttribute(uiElement, "AXRole")
  set subroleText to my readAttribute(uiElement, "AXSubrole")
  set titleText to my readAttribute(uiElement, "AXTitle")
  set descriptionText to my readAttribute(uiElement, "AXDescription")
  set valueText to my readAttribute(uiElement, "AXValue")
  set helpText to my readAttribute(uiElement, "AXHelp")
  set identifierText to my readAttribute(uiElement, "AXIdentifier")

  set lineText to my indentText(currentDepth) & "- role=" & roleText
  if subroleText is not equal to "" then
    set lineText to lineText & " subrole=" & subroleText
  end if
  if titleText is not equal to "" then
    set lineText to lineText & " title=" & titleText
  end if
  if descriptionText is not equal to "" then
    set lineText to lineText & " description=" & descriptionText
  end if
  if valueText is not equal to "" then
    set lineText to lineText & " value=" & valueText
  end if
  if helpText is not equal to "" then
    set lineText to lineText & " help=" & helpText
  end if
  if identifierText is not equal to "" then
    set lineText to lineText & " id=" & identifierText
  end if
  set resultText to lineText & linefeed

  try
    tell application "System Events"
      set childElements to UI elements of uiElement
    end tell
    repeat with childElement in childElements
      set resultText to resultText & my describeElement(childElement, currentDepth + 1, maxDepth)
    end repeat
  end try

  return resultText
end describeElement

tell application "System Events"
  set matchingProcesses to processes whose name is targetProcessName
  if (count of matchingProcesses) is 0 then
    return "Process is not running: " & targetProcessName
  end if

  set targetProcess to item 1 of matchingProcesses
  return my describeElement(targetProcess, 0, maxDepth)
end tell
`;
}

/**
 * @param {string} value
 */
function toAppleScriptString(value) {
  return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}
