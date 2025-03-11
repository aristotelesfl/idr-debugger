export interface WorkflowParameter {
  id: string
  value: any
  type: string
}

export interface WorkflowItem {
  action_id: number | null
  condition_id: number | null
  description: string | null
  id: string | null
  identifier: string
  open: boolean
  parallel_flow: boolean
  parameters: WorkflowParameter[]
  result: boolean | null
  type: number
}

export interface WorkflowData {
  data: WorkflowItem[]
  meta: {
    current_page: number
    from: number
    last_page: number
    path: string | null
    per_page: number
    to: number
    total: number
  }
  extra: any
}

export interface TreeNode {
  item: WorkflowItem
  children: TreeNode[]
}

