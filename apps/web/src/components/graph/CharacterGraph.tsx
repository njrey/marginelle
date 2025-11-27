import { useRef, useEffect } from 'react'
import * as d3Force from 'd3-force'
import * as d3Selection from 'd3-selection'
import * as d3Drag from 'd3-drag'
import * as d3Zoom from 'd3-zoom'
import * as d3Polygon from 'd3-polygon'
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

interface OrganizationGroup {
  id: string
  name: string
  memberIds: string[]
  pageNumber: number
  color: string
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
  organizations?: OrganizationGroup[]
  onNodeClick?: (nodeId: string) => void
}

export function CharacterGraph({ nodes, edges, organizations = [], onNodeClick }: CharacterGraphProps) {
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

    // Create layers for proper z-ordering (hulls behind everything)
    const hullLayer = g.append('g').attr('class', 'hulls')
    const linkLayer = g.append('g').attr('class', 'links')
    const nodeLayer = g.append('g').attr('class', 'nodes')

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
    const link = linkLayer
      .selectAll('line')
      .data(edgesCopy)
      .join('line')
      .attr('stroke', 'black')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)

    // Create nodes
    const node = nodeLayer
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

    // Helper function to draw convex hulls around organization members
    const drawHulls = () => {
      // Remove old hulls
      hullLayer.selectAll('path').remove()
      hullLayer.selectAll('text').remove()

      organizations.forEach(org => {
        // Get the positions of all member nodes
        const memberNodes = nodesCopy.filter(n => org.memberIds.includes(n.id))
        if (memberNodes.length < 2) return // Need at least 2 nodes for a hull

        // Get node positions with padding
        const points = memberNodes
          .filter(n => n.x !== undefined && n.y !== undefined)
          .map(n => [n.x!, n.y!] as [number, number])

        if (points.length < 2) return

        // Calculate convex hull
        const hull = d3Polygon.polygonHull(points)
        if (!hull) return

        // Expand hull outward for padding
        const centroid = d3Polygon.polygonCentroid(hull)
        const paddedHull = hull.map(point => {
          const dx = point[0] - centroid[0]
          const dy = point[1] - centroid[1]
          const distance = Math.sqrt(dx * dx + dy * dy)
          const padding = 50 // pixels of padding
          return [
            point[0] + (dx / distance) * padding,
            point[1] + (dy / distance) * padding
          ]
        })

        // Draw the hull
        hullLayer.append('path')
          .datum(paddedHull)
          .attr('d', (d) => {
            return 'M' + d.join('L') + 'Z'
          })
          .attr('fill', org.color)
          .attr('fill-opacity', 0.15)
          .attr('stroke', org.color)
          .attr('stroke-width', 2)
          .attr('stroke-opacity', 0.5)
          .attr('stroke-dasharray', '5,5')
          .attr('rx', 20) // Rounded corners

        // Add organization label
        hullLayer.append('text')
          .attr('x', centroid[0])
          .attr('y', centroid[1] - d3Polygon.polygonLength(hull) / 4)
          .attr('text-anchor', 'middle')
          .attr('fill', org.color)
          .attr('font-size', '14px')
          .attr('font-weight', 'bold')
          .attr('opacity', 0.7)
          .text(org.name)
      })
    }

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`)

      // Redraw hulls on every tick to follow nodes
      drawHulls()
    })

    return () => {
      simulation.stop()
    }
  }, [nodes, edges, organizations, onNodeClick])

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
