"use client"

import { useState, useEffect, useRef } from "react"
import type { WorkflowItem, TreeNode } from "@/types/workflow"
import { ChevronDown, ChevronRight, Plus, Minus } from "lucide-react"

interface WorkflowTreeProps {
  data: WorkflowItem[]
  debugPath?: string[]
  currentDebugStep?: number
}

const WorkflowTree = ({ data, debugPath = [], currentDebugStep = -1 }: WorkflowTreeProps) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [parallelFlowFirstNodes, setParallelFlowFirstNodes] = useState<Set<string>>(new Set())
  const [expandAll, setExpandAll] = useState(false)
  const isDebugging = debugPath.length > 0 && currentDebugStep >= 0

  // Function to toggle expand/collapse all nodes
  const toggleExpandAll = () => {
    setExpandAll(!expandAll)
  }

  useEffect(() => {
    // Build the tree structure from flat data
    const buildTree = (items: WorkflowItem[]): TreeNode[] => {
      if (!items || items.length === 0) return []

      const itemMap = new Map<string, WorkflowItem>()
      const rootNodes: TreeNode[] = []
      const parallelFlowGroups = new Map<string, string[]>()
      const firstParallelNodes = new Set<string>()

      // First, map all items by their identifier
      items.forEach((item) => {
        itemMap.set(item.identifier, item)
      })

      // Group parallel flow items
      items.forEach((item) => {
        if (item.parallel_flow) {
          // Get the parent identifier (or use the item's identifier if it's a root)
          const parts = item.identifier.split(".")
          const parentId = parts.length > 1 ? parts.slice(0, parts.length - 1).join(".") : item.identifier

          if (!parallelFlowGroups.has(parentId)) {
            parallelFlowGroups.set(parentId, [])
          }

          parallelFlowGroups.get(parentId)?.push(item.identifier)
        }
      })

      // Mark the first node in each parallel flow group
      parallelFlowGroups.forEach((nodes) => {
        if (nodes.length > 0) {
          // Sort by identifier to ensure consistent ordering
          nodes.sort()
          firstParallelNodes.add(nodes[0])
        }
      })

      setParallelFlowFirstNodes(firstParallelNodes)

      // Create a map to store parent-child relationships
      const childrenMap = new Map<string, TreeNode[]>()

      // Process each item to determine parent-child relationships
      items.forEach((item) => {
        const parts = item.identifier.split(".")

        if (parts.length === 1) {
          // This is a root node
          rootNodes.push({ item, children: [] })
        } else {
          // This is a child node
          const parentId = parts.slice(0, parts.length - 1).join(".")

          if (!childrenMap.has(parentId)) {
            childrenMap.set(parentId, [])
          }

          childrenMap.get(parentId)?.push({ item, children: [] })
        }
      })

      // Recursive function to build the tree
      const buildSubtree = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map((node) => {
          const children = childrenMap.get(node.item.identifier) || []
          return {
            ...node,
            children: buildSubtree(children),
          }
        })
      }

      // Build the complete tree
      return buildSubtree(rootNodes)
    }

    setTreeData(buildTree(data))
  }, [data])

  // Scroll to the current debug step node when it changes
  useEffect(() => {
    if (debugPath.length > 0 && currentDebugStep >= 0 && currentDebugStep < debugPath.length) {
      const currentNodeId = debugPath[currentDebugStep]

      // Give time for the DOM to update (expand nodes) before scrolling
      setTimeout(() => {
        const nodeElement = document.getElementById(`node-${currentNodeId}`)
        if (nodeElement) {
          nodeElement.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 100)
    }
  }, [debugPath, currentDebugStep])

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-40 text-gray-500 text-lg font-medium">No IDR found.</div>
  }

  return (
    <div className="workflow-tree">
      <div className="flex justify-end mb-2">
        <button
          onClick={toggleExpandAll}
          className="flex items-center justify-center p-1 border border-gray-300 rounded-md hover:bg-gray-100"
          title={expandAll ? "Collapse all nodes" : "Expand all nodes"}
        >
          {expandAll ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      </div>
      {treeData.map((node, index) => (
        <TreeNodeComponent
          key={index}
          node={node}
          level={0}
          debugPath={debugPath}
          currentDebugStep={currentDebugStep}
          isFirstParallelNode={parallelFlowFirstNodes.has(node.item.identifier)}
          parallelFlowFirstNodes={parallelFlowFirstNodes}
          expandAll={expandAll}
          isDebugging={isDebugging}
        />
      ))}
    </div>
  )
}

interface TreeNodeComponentProps {
  node: TreeNode
  level: number
  debugPath: string[]
  currentDebugStep: number
  isFirstParallelNode: boolean
  parallelFlowFirstNodes: Set<string>
  expandAll: boolean
  isDebugging: boolean
}

const TreeNodeComponent = ({
  node,
  level,
  debugPath,
  currentDebugStep,
  isFirstParallelNode,
  parallelFlowFirstNodes,
  expandAll,
  isDebugging,
}: TreeNodeComponentProps) => {
  const [isOpen, setIsOpen] = useState(node.item.open)
  const nodeRef = useRef<HTMLDivElement>(null)
  const isCondition = node.item.type === 1
  const hasChildren = node.children.length > 0

  // Check if this node is in the debug path
  const debugIndex = debugPath.indexOf(node.item.identifier)
  const isInDebugPath = debugIndex !== -1
  const isCurrentDebugStep = debugIndex === currentDebugStep
  const isVisitedInDebug = debugIndex !== -1 && debugIndex <= currentDebugStep

  // Check if this node is a direct parent of any node in the debug path
  const isDirectParentInDebugPath = debugPath.some((path) => {
    const pathParts = path.split(".")
    if (pathParts.length <= 1) return false

    const parentPath = pathParts.slice(0, pathParts.length - 1).join(".")
    return parentPath === node.item.identifier
  })

  // Check if any child of this node is the current debug step
  const isChildCurrentDebugStep =
    currentDebugStep >= 0 &&
    currentDebugStep < debugPath.length &&
    debugPath[currentDebugStep] !== node.item.identifier &&
    debugPath[currentDebugStep].startsWith(node.item.identifier + ".")

  // Update open state when expandAll changes
  useEffect(() => {
    setIsOpen(expandAll || node.item.open)
  }, [expandAll, node.item.open])

  // Auto-expand only if this node is a direct parent in the debug path or is the current step
  useEffect(() => {
    if (isChildCurrentDebugStep || isDirectParentInDebugPath) {
      setIsOpen(true)
    }
  }, [isChildCurrentDebugStep, isDirectParentInDebugPath])

  // Get node description based on action_id or condition_id
  const getNodeDescription = () => {
    if (isCondition) {
      switch (node.item.condition_id) {
        case 1:
          return "Mensagem recebida"
        case 2:
          return "Contato novo ou muito antigo"
        case 3:
          return "Possui segmento vinculado ao contato"
        case 4:
          return "Hoje é dia útil"
        case 5:
          return "Hoje é Sábado"
        case 6:
          return "Hoje é Domingo"
        case 7:
          return "Atendente disponível"
        case 8:
          return "Mensagem possui termo"
        case 9:
          return "Mensagem possui termo na lista de restrições"
        case 10:
          return "Última ação executada retornou sucesso"
        case 11:
          return "Contato muito tempo aguardando resposta da operação"
        case 12:
          return "Contato incluído por mailing"
        case 13:
          return "Mensagem retorno última chamada externa possui termo"
        case 14:
          return "Mensagem retorno última execução DovePL possui termo"
        case 15:
          return "Origem da última mensagem enviada ao contato"
        case 16:
          return "Última mensagem enviada ao contato possui termo"
        case 17:
          return "Indício de Chatbot abandonado pelo contato"
        case 18:
          return "Etapa atual é recorrente"
        case 19:
          return "CPF/CNPJ conhecido"
        case 20:
          return "Contato logou no chat"
        case 21:
          return "Indício de Atendente abandonado pelo contato fidelizado"
        case 22:
          return "Contato possui evento"
        case 23:
          return "Sessão de 24hrs do WhatsApp prestes a fechar"
        case 24:
          return "Fluxo disparado externamente"
        case 25:
          return "Último evento do contato"
        case 26:
          return "Mensagem possui arquivo"
        case 27:
          return "Mensagem enviada pela operação"
        case 28:
          return "Evento criado"
        case 29:
          return "Conteúdo da variável"
        case 30:
          return "Hoje/Agora é"
        case 31:
          return "Canal atual"
        case 32:
          return "Contato em atendimento pela operação (fidelizado)"
        case 33:
          return "Movimentação de cartão no Pipeline (beta)"
        case 34:
          return "Contato está na lista de restrição"
        case 35:
          return "Ligação de Voz Interrompida"
        default:
          return node.item.description || "Condição"
      }
    } else {
      switch (node.item.action_id) {
        case 1:
          return "Enviar mensagem"
        case 2:
          return "Aguardar mensagem de resposta"
        case 3:
          return "Vincular segmento ao contato (identificar por mensagem do contato)"
        case 4:
          return "Vincular segmento ao contato (identificar por API ou variável)"
        case 5:
          return "Vincular segmento ao contato (fixo)"
        case 6:
          return "Retirar contato da operação e transferir para atendimento via chatbot"
        case 7:
          return "Finalizar atendimento"
        case 8:
          return "Enviar contato para a fila da operação"
        case 9:
          return "Enviar contato para um atendente específico"
        case 10:
          return "Ir para"
        case 11:
          return "API - Chamada Externa"
        case 12:
          return "Executar bloco de código DovePL"
        case 13:
          return "Registrar evento"
        case 14:
          return "Definir prioridade"
        case 15:
          return "Aguardar (até tempo de espera ou solicitação externa)"
        case 16:
          return "Enviar grupo de botões para Webchat"
        case 17:
          return "Pesquisar mensagem recebida na base de conhecimento"
        case 18:
          return "Registrar resposta para curadoria"
        case 19:
          return "Enviar arquivo"
        case 20:
          return "Criar ou atualizar variável"
        case 21:
          return "Salvar dado do contato"
        case 22:
          return "Enviar botões de resposta para WhatsApp"
        case 23:
          return "Enviar lista interativa para WhatsApp"
        case 24:
          return "Cartão de Pipeline (Beta)"
        case 25:
          return "Desligar chamada de voz"
        case 26:
          return "Fazer tabulação de voz"
        case 27:
          return "Enviar contato para a lista de restrição"
        case 28:
          return "Enviar flow de WhatsApp"
        case 29:
          return "Enviar botão de pagamento no WhatsApp"
        case 30:
          return "Enviar status de pedido no WhatsApp"
        default:
          return node.item.description || "Ação"
      }
    }
  }

  // Get parameter summary for display
  const getParameterSummary = () => {
    if (!node.item.parameters || node.item.parameters.length === 0) return ""

    const truncateValue = (value: string, maxLength = 50) => {
      if (value.length <= maxLength) return value
      return value.substring(0, maxLength) + "..."
    }

    const params = node.item.parameters
      .map((param) => {
        if (param.type === "array-text" && Array.isArray(param.value)) {
          const text = param.value.map((v: any) => v.text).join(", ")
          return `Mensagem: ${truncateValue(text)}`
        }
        if (param.type === "interactive-list") {
          const sections = param.value?.action?.sections || []
          return `${sections.length} seção com ${sections.reduce((acc: number, s: any) => acc + (s.rows?.length || 0), 0)} item`
        }
        if (param.type === "interactive-button") {
          const buttons = param.value?.action?.buttons || []
          return `${buttons.length} botão`
        }
        // Handle string values
        if (typeof param.value === "string") {
          return truncateValue(param.value)
        }
        // Handle other types of values
        return param.value ? truncateValue(String(param.value)) : ""
      })
      .filter(Boolean)

    return params.join(" - ")
  }

  // Get background color based on debug state
  const getNodeBackgroundColor = () => {
    if (isDebugging) {
      if (isCurrentDebugStep) return "bg-green-200"
      if (isVisitedInDebug) return "bg-green-100"
    }
    return "bg-white"
  }

  // Get status dot color
  const getStatusDotColor = () => {
    if (node.item.parallel_flow && isFirstParallelNode) {
      return "bg-yellow-400"
    } else if (isCondition) {
      return "bg-blue-700"
    } else {
      return "bg-blue-400"
    }
  }

  return (
    <div className="flex flex-col" id={`node-${node.item.identifier}`} ref={nodeRef}>
      <div className={`flex items-center py-2 rounded-md ${getNodeBackgroundColor()} transition-colors duration-300`}>
        {/* Indentation and toggle */}
        <div className="flex items-center" style={{ width: `${level * 20 + 20}px` }}>
          {hasChildren && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-4 h-4 flex items-center justify-center text-blue-500 toggle-button"
              data-open={isOpen}
            >
              {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
          )}
        </div>

        {/* Status dot */}
        <div className="mr-2">
          <div className={`w-3 h-3 rounded-full ${getStatusDotColor()}`}></div>
        </div>

        {/* Node label */}
        <div className="flex items-center flex-wrap gap-2 flex-grow">
          <div
            className={`px-3 py-1 rounded-full border ${isCondition ? "border-blue-200 bg-white" : "border-gray-200 bg-white"} text-sm flex items-center`}
          >
            <span>{getNodeDescription()}</span>
            {isCondition && node.item.result !== null && (
              <div className={`ml-1 w-2 h-2 rounded-full ${node.item.result ? "bg-green-500" : "bg-red-500"}`}></div>
            )}
          </div>

          {getParameterSummary() && (
            <div className="text-sm text-gray-500 truncate max-w-sm">{getParameterSummary()}</div>
          )}

          <div className="text-sm text-gray-400 ml-auto">{node.item.identifier}</div>
        </div>
      </div>

      {/* Children */}
      {isOpen && hasChildren && (
        <div className="ml-4">
          {node.children.map((childNode, index) => (
            <TreeNodeComponent
              key={index}
              node={childNode}
              level={level + 1}
              debugPath={debugPath}
              currentDebugStep={currentDebugStep}
              isFirstParallelNode={parallelFlowFirstNodes.has(childNode.item.identifier)}
              parallelFlowFirstNodes={parallelFlowFirstNodes}
              expandAll={expandAll}
              isDebugging={isDebugging}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default WorkflowTree

