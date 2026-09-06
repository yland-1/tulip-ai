import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SkillMetadata {
  name: string;
  description: string;
  path: string;
}

/**
 * Resolves the skills directory path (checking local ./skills and .agents/skills).
 */
export function getSkillsDirectory(): string {
  const localSkillsDir = path.resolve(__dirname, "../skills");
  if (fs.existsSync(localSkillsDir)) {
    return localSkillsDir;
  }
  const agentsSkillsDir = path.resolve(__dirname, "../.agents/skills");
  if (fs.existsSync(agentsSkillsDir)) {
    return agentsSkillsDir;
  }
  return localSkillsDir;
}

/**
 * Scans and indexes all downloaded Google Ads skills from disk.
 */
export function getAvailableSkills(): SkillMetadata[] {
  const skillsDir = getSkillsDirectory();
  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const skills: SkillMetadata[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillMdPath = path.join(skillsDir, entry.name, "SKILL.md");
      if (fs.existsSync(skillMdPath)) {
        const content = fs.readFileSync(skillMdPath, "utf-8");
        const nameMatch = content.match(/^name:\s*(.+)$/m);
        const descMatch = content.match(/^description:\s*["']?([\s\S]*?)["']?\nmetadata:/m);

        skills.push({
          name: nameMatch ? nameMatch[1].trim() : entry.name,
          description: descMatch ? descMatch[1].trim().replace(/\n/g, " ") : "",
          path: skillMdPath,
        });
      }
    }
  }

  return skills;
}

/**
 * Loads the full markdown playbook content of a specific skill.
 */
export function loadSkillContent(skillName: string): string | null {
  const skillsDir = getSkillsDirectory();
  const directPath = path.join(skillsDir, skillName, "SKILL.md");
  if (fs.existsSync(directPath)) {
    return fs.readFileSync(directPath, "utf-8");
  }

  // Check by matching skill name in metadata
  const skills = getAvailableSkills();
  const match = skills.find((s) => s.name === skillName);
  if (match && fs.existsSync(match.path)) {
    return fs.readFileSync(match.path, "utf-8");
  }

  return null;
}
