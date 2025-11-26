import { useRef, useEffect } from 'react'
import * as d3Force from 'd3-force'
import * as d3Selection from 'd3-selection'
import * as d3Drag from 'd3-drag'
import * as d3Zoom from 'd3-zoom'
import 'd3-transition'
import { Card } from '@/components/ui/card'

interface GraphNode {
  id: string
  label: string
  pageNumber: number
}

interface GraphEdge {
  source: string
  target: string
  pageNumber: number
}

// D3 augmented node type (adds x, y, vx, vy, fx, fy)
interface ForceNode extends GraphNode {
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

interface CharacterGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  onNodeClick?: (nodeId: string) => void
}

export function CharacterGraph({ nodes, edges, onNodeClick }: CharacterGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3Force.Simulation<ForceNode, undefined> | null>(null)

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const width = 800
    const height = 600

    // Clear previous graph
    d3Selection.select(svgRef.current).selectAll('*').remove()

    const svg = d3Selection.select(svgRef.current)
    const g = svg.append('g')

    // Create copies to avoid mutating props
    const nodesCopy: ForceNode[] = nodes.map(d => ({ ...d }))
    const edgesCopy = edges.map(d => ({ ...d }))

    // Force simulation
    const simulation = d3Force.forceSimulation(nodesCopy)
      .force('link', d3Force.forceLink(edgesCopy)
        .id((d: any) => d.id)
        .distance(100))
      .force('charge', d3Force.forceManyBody().strength(-300))
      .force('center', d3Force.forceCenter(width / 2, height / 2))
      .force('collision', d3Force.forceCollide().radius(40))
      .alpha(0.3)
      .alphaDecay(0.02)

    simulationRef.current = simulation

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(edgesCopy)
      .join('line')
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)

    // Create nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodesCopy)
      .join('g')
      .attr('cursor', 'pointer')

    // Circle for node
    node.append('circle')
      .attr('r', 30)
      .attr('fill', 'white')
      .attr('stroke', 'hsl(var(--border))')
      .attr('stroke-width', 2)
      .on('mouseover', function() {
        d3Selection.select(this).transition().duration(200).attr('r', 33)
      })
      .on('mouseout', function() {
        d3Selection.select(this).transition().duration(200).attr('r', 30)
      })

    // Text label
    node.append('text')
      .text((d: GraphNode) => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'hsl(var(--primary-foreground))')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('pointer-events', 'none')

    // Page number badge
    node.append('text')
      .text((d: GraphNode) => `p.${d.pageNumber}`)
      .attr('text-anchor', 'middle')
      .attr('dy', '45')
      .attr('fill', 'hsl(var(--muted-foreground))')
      .attr('font-size', '10px')
      .attr('pointer-events', 'none')

    // Click handler
    if (onNodeClick) {
      node.on('click', (event: MouseEvent, d: GraphNode) => {
        event.stopPropagation()
        onNodeClick(d.id)
      })
    }

    // Drag behavior
    const drag = d3Drag.drag<any, ForceNode>()
      .on('start', (event: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        event.subject.fx = event.subject.x
        event.subject.fy = event.subject.y
      })
      .on('drag', (event: any) => {
        event.subject.fx = event.x
        event.subject.fy = event.y
      })
      .on('end', (event: any) => {
        if (!event.active) simulation.alphaTarget(0)
        event.subject.fx = null
        event.subject.fy = null
      })

    node.call(drag)

    // Zoom behavior
    const zoom = d3Zoom.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform)
      })

    svg.call(zoom as any)

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })

    return () => {
      simulation.stop()
    }
  }, [nodes, edges, onNodeClick])

  return (
    <Card className="p-4">
      <svg
        ref={svgRef}
        width="100%"
        height="600"
        viewBox="0 0 800 600"
        className="border border-border rounded-lg bg-background"
      />
    </Card>
  )
}
