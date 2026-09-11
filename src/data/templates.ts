import { autoLayout } from '@/lib/layout'
import { uid } from '@/lib/utils'
import { defaultEdgeStyle } from '@/data/edgeStyles'
import { makeNodeData } from '@/data/nodeStyles'
import type { NodeShape, TreeNode, TreeEdge, TreeTemplate, NodeStyle, LayoutDirection } from '@/types'

/** Declarative spec used to define templates compactly */
export interface NodeSpec {
  title: string
  subtitle?: string
  description?: string
  icon?: string
  shape?: NodeShape
  style?: Partial<NodeStyle>
  children?: NodeSpec[]
}

interface BuiltTree {
  nodes: TreeNode[]
  edges: TreeEdge[]
}

/**
 * Build nodes + edges from a nested spec. Positions are filled by the
 * auto-layout engine afterwards.
 */
export function buildTreeFromSpec(root: NodeSpec, direction: LayoutDirection = 'TB'): BuiltTree {
  const nodes: TreeNode[] = []
  const edges: TreeEdge[] = []

  function walk(spec: NodeSpec, parentId: string | null) {
    const id = uid()
    nodes.push({
      id,
      type: 'treeNode',
      position: { x: nodes.length * 240, y: (nodes.length % 5) * 140 },
      data: makeNodeData({
        title: spec.title,
        subtitle: spec.subtitle ?? '',
        description: spec.description ?? '',
        icon: spec.icon ?? '',
        shape: spec.shape ?? 'rounded',
        style: spec.style,
      }),
    })
    if (parentId) {
      edges.push({
        id: uid('e'),
        source: parentId,
        target: id,
        type: 'smoothstep',
        data: defaultEdgeStyle(),
      })
    }
    spec.children?.forEach((child) => walk(child, id))
  }

  walk(root, null)
  return { nodes: autoLayout(nodes, edges, direction), edges }
}

const universitySpec: NodeSpec = {
  title: 'University Council',
  subtitle: 'President',
  description: 'Administrative authority',
  icon: 'Landmark',
  children: [
    {
      title: 'University President',
      subtitle: 'Chief Executive',
      icon: 'Crown',
      children: [
        { title: 'President Office', subtitle: 'Support', icon: 'Briefcase' },
        { title: 'Advisors', subtitle: 'Consulting', icon: 'Users2' },
        { title: 'Committees', subtitle: 'Governance', icon: 'ListChecks' },
      ],
    },
    {
      title: 'Academic Affairs',
      subtitle: 'Vice President',
      icon: 'GraduationCap',
      children: [
        { title: 'College of Engineering', subtitle: 'Faculty', icon: 'Cog' },
        { title: 'College of Medicine', subtitle: 'Faculty', icon: 'HeartPulse' },
        { title: 'College of Business', subtitle: 'Faculty', icon: 'Briefcase' },
        { title: 'College of Computing', subtitle: 'Faculty', icon: 'Cpu' },
      ],
    },
    {
      title: 'Administration',
      subtitle: 'Vice President',
      icon: 'Building',
      children: [
        { title: 'Finance', subtitle: 'Department', icon: 'Banknote' },
        { title: 'Human Resources', subtitle: 'Department', icon: 'Users' },
        { title: 'Information Technology', subtitle: 'Department', icon: 'Server' },
        { title: 'Student Affairs', subtitle: 'Department', icon: 'GraduationCap' },
      ],
    },
  ],
}

const companySpec: NodeSpec = {
  title: 'CEO',
  subtitle: 'Chief Executive Officer',
  icon: 'Crown',
  children: [
    {
      title: 'Product',
      subtitle: 'CPO',
      icon: 'Package',
      children: [
        { title: 'Design', icon: 'Palette' },
        { title: 'Engineering', icon: 'Laptop' },
      ],
    },
    {
      title: 'Marketing',
      subtitle: 'CMO',
      icon: 'Sparkles',
      children: [
        { title: 'Growth', icon: 'Rocket' },
        { title: 'Content', icon: 'FileText' },
      ],
    },
    {
      title: 'Operations',
      subtitle: 'COO',
      icon: 'Settings',
      children: [
        { title: 'Finance', icon: 'Banknote' },
        { title: 'Human Resources', icon: 'Users' },
        { title: 'Legal', icon: 'Scale' },
      ],
    },
  ],
}

const governmentSpec: NodeSpec = {
  title: 'Prime Minister',
  subtitle: 'Head of Government',
  icon: 'Landmark',
  children: [
    {
      title: 'Ministry of Interior',
      icon: 'Shield',
      children: [
        { title: 'Police', icon: 'Shield' },
        { title: 'Civil Defense', icon: 'Shield' },
      ],
    },
    {
      title: 'Ministry of Health',
      icon: 'HeartPulse',
      children: [
        { title: 'Hospitals', icon: 'Building2' },
        { title: 'Public Health', icon: 'Microscope' },
      ],
    },
    {
      title: 'Ministry of Education',
      icon: 'BookOpen',
      children: [
        { title: 'Schools', icon: 'BookOpen' },
        { title: 'Universities', icon: 'GraduationCap' },
      ],
    },
    {
      title: 'Ministry of Finance',
      icon: 'Banknote',
      children: [{ title: 'Treasury', icon: 'Wallet' }],
    },
  ],
}

const familySpec: NodeSpec = {
  title: 'Grandparents',
  subtitle: 'The Smith Family',
  icon: 'Heart',
  children: [
    {
      title: 'John & Mary',
      subtitle: 'Parents',
      icon: 'Users',
      children: [
        { title: 'Anna', subtitle: 'Daughter', icon: 'Users2' },
        {
          title: 'Tom & Sara',
          subtitle: 'Son & Wife',
          icon: 'Users2',
          children: [{ title: 'Lucas', subtitle: 'Grandson' }],
        },
        { title: 'David', subtitle: 'Son', icon: 'Users2' },
      ],
    },
    { title: 'Elena', subtitle: 'Aunt', icon: 'Users2' },
  ],
}

const simpleSpec: NodeSpec = {
  title: 'Root',
  subtitle: 'Level 1',
  children: [
    { title: 'Child A', subtitle: 'Level 2', children: [{ title: 'Grandchild A1' }, { title: 'Grandchild A2' }] },
    { title: 'Child B', subtitle: 'Level 2', children: [{ title: 'Grandchild B1' }] },
    { title: 'Child C', subtitle: 'Level 2' },
  ],
}

const projectTeamSpec: NodeSpec = {
  title: 'Project Lead',
  subtitle: 'Phoenix Project',
  icon: 'Rocket',
  children: [
    {
      title: 'Frontend Team',
      icon: 'Laptop',
      children: [
        { title: 'UI Developer' },
        { title: 'UX Designer', icon: 'Palette' },
      ],
    },
    {
      title: 'Backend Team',
      icon: 'Server',
      children: [
        { title: 'API Developer' },
        { title: 'Database Engineer', icon: 'Database' },
      ],
    },
    { title: 'QA Engineer', icon: 'Search' },
    { title: 'Product Owner', icon: 'Target' },
  ],
}

const departmentSpec: NodeSpec = {
  title: 'Dean Office',
  subtitle: 'College',
  icon: 'Building2',
  children: [
    {
      title: 'Computer Science',
      subtitle: 'Department',
      icon: 'Cpu',
      children: [{ title: 'Software Eng.' }, { title: 'AI & Data' }],
    },
    {
      title: 'Electrical Eng.',
      subtitle: 'Department',
      icon: 'Zap',
      children: [{ title: 'Electronics' }, { title: 'Power Systems' }],
    },
    { title: 'Mechanical Eng.', subtitle: 'Department', icon: 'Cog' },
    { title: 'Student Services', subtitle: 'Department', icon: 'Handshake' },
  ],
}

/* ------------------------------------------------------------------ */
/* Template registry                                                   */
/* ------------------------------------------------------------------ */

export const templates: TreeTemplate[] = [
  { id: 'university', name: 'University Organization', description: 'University council, president & colleges', build: () => buildTreeFromSpec(universitySpec) },
  { id: 'company', name: 'Company Organization', description: 'CEO with product, marketing & ops', build: () => buildTreeFromSpec(companySpec) },
  { id: 'government', name: 'Government Organization', description: 'Ministries and their offices', build: () => buildTreeFromSpec(governmentSpec) },
  { id: 'family', name: 'Family Tree', description: 'Three-generation family structure', build: () => buildTreeFromSpec(familySpec) },
  { id: 'simple', name: 'Simple Hierarchy', description: 'Minimal root with children', build: () => buildTreeFromSpec(simpleSpec) },
  { id: 'project', name: 'Project Team', description: 'Lead with sub-teams and roles', build: () => buildTreeFromSpec(projectTeamSpec) },
  { id: 'department', name: 'Department Structure', description: 'Dean office and engineering departments', build: () => buildTreeFromSpec(departmentSpec) },
]

/** The demo tree shown on first launch (same as University template). */
export function createDemoTree(): BuiltTree {
  return buildTreeFromSpec(universitySpec)
}


