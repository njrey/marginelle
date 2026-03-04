import { useRef, useEffect } from "react";
import * as d3Force from "d3-force";
import * as d3Selection from "d3-selection";
import * as d3Drag from "d3-drag";
import * as d3Zoom from "d3-zoom";
import * as d3Polygon from "d3-polygon";
import "d3-transition";
import { Card } from "@/components/ui/card";
import type { NoteType, RelationshipType } from "@marginelle/schema";

interface GraphNode {
  id: string;
  label: string;
  pageNumber: number;
  noteType: NoteType;
}

interface GraphEdge {
  source: string;
  target: string;
  pageNumber: number;
  relationshipType: RelationshipType;
}

interface OrganizationGroup {
  id: string;
  name: string;
  memberIds: string[];
  pageNumber: number;
  color: string;
}

interface OrgLink {
  sourceOrgId: string;
  targetOrgId: string;
  relationshipType: "ally" | "enemy";
  pageNumber: number;
}

// D3 augmented node type (adds x, y, vx, vy, fx, fy)
interface ForceNode extends GraphNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface CharacterGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  organizations?: OrganizationGroup[];
  orgLinks?: OrgLink[];
  onNodeClick?: (nodeId: string) => void;
}

// Visual config for each note type
const NODE_TYPE_CONFIG: Record<
  NoteType,
  { fill: string; stroke: string; shape: "circle" | "rect" | "diamond" }
> = {
  character: { fill: "white", stroke: "hsl(var(--border))", shape: "circle" },
  organization: { fill: "#dbeafe", stroke: "#3b82f6", shape: "rect" },
  event: { fill: "#fef3c7", stroke: "#f59e0b", shape: "diamond" },
  location: { fill: "#d1fae5", stroke: "#10b981", shape: "rect" },
  item: { fill: "#ede9fe", stroke: "#8b5cf6", shape: "diamond" },
  concept: { fill: "#fce7f3", stroke: "#ec4899", shape: "circle" },
};

// Visual config for each relationship type
const EDGE_TYPE_CONFIG: Record<
  RelationshipType,
  {
    color: string;
    dashArray: string;
    directed: boolean;
    label: string;
  }
> = {
  friend: { color: "#3b82f6", dashArray: "0", directed: false, label: "Friend" },
  family: { color: "#8b5cf6", dashArray: "0", directed: false, label: "Family" },
  ally: { color: "#10b981", dashArray: "0", directed: false, label: "Ally" },
  enemy: { color: "#ef4444", dashArray: "10,5", directed: false, label: "Enemy" },
  impacts: { color: "#f59e0b", dashArray: "6,3", directed: true, label: "Impacts" },
  causes: { color: "#f97316", dashArray: "6,3", directed: true, label: "Causes" },
  owns: { color: "#06b6d4", dashArray: "0", directed: true, label: "Owns" },
  located_in: { color: "#10b981", dashArray: "4,4", directed: true, label: "Located In" },
  member_of: { color: "#6b7280", dashArray: "3,3", directed: true, label: "Member Of" },
};

export function CharacterGraph({
  nodes,
  edges,
  organizations = [],
  orgLinks = [],
  onNodeClick,
}: CharacterGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3Force.Simulation<ForceNode, undefined> | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const width = 800;
    const height = 600;

    // Clear previous graph
    d3Selection.select(svgRef.current).selectAll("*").remove();

    const svg = d3Selection.select(svgRef.current);

    // Define arrowhead markers for directed edges
    const defs = svg.append("defs");
    const directedRelTypes = (
      Object.entries(EDGE_TYPE_CONFIG) as [
        RelationshipType,
        (typeof EDGE_TYPE_CONFIG)[RelationshipType],
      ][]
    ).filter(([, cfg]) => cfg.directed);

    directedRelTypes.forEach(([type, cfg]) => {
      defs
        .append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 28)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", cfg.color)
        .attr("opacity", 0.8);
    });

    const g = svg.append("g");

    // Create layers for proper z-ordering
    const hullLayer = g.append("g").attr("class", "hulls");
    const orgLinkLayer = g.append("g").attr("class", "org-links");
    const linkLayer = g.append("g").attr("class", "links");
    const nodeLayer = g.append("g").attr("class", "nodes");
    const tooltipLayer = g.append("g").attr("class", "tooltips");

    // Create copies to avoid mutating props
    const nodesCopy: ForceNode[] = nodes.map((d) => ({ ...d }));
    const edgesCopy: (GraphEdge & { source: any; target: any })[] = edges.map((d) => ({ ...d }));

    // Force simulation
    const simulation = d3Force
      .forceSimulation(nodesCopy)
      .force(
        "link",
        d3Force
          .forceLink(edgesCopy)
          .id((d: any) => d.id)
          .distance(120),
      )
      .force("charge", d3Force.forceManyBody().strength(-300))
      .force("center", d3Force.forceCenter(width / 2, height / 2))
      .force("collision", d3Force.forceCollide().radius(45))
      .alpha(0.3)
      .alphaDecay(0.02);

    simulationRef.current = simulation;

    // Create links grouped by relationship type for proper styling
    const link = linkLayer
      .selectAll("line")
      .data(edgesCopy)
      .join("line")
      .attr("stroke", (d: GraphEdge) => EDGE_TYPE_CONFIG[d.relationshipType]?.color ?? "#999")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.7)
      .attr(
        "stroke-dasharray",
        (d: GraphEdge) => EDGE_TYPE_CONFIG[d.relationshipType]?.dashArray ?? "0",
      )
      .attr("marker-end", (d: GraphEdge) =>
        EDGE_TYPE_CONFIG[d.relationshipType]?.directed ? `url(#arrow-${d.relationshipType})` : null,
      )
      .attr("cursor", "default");

    // Edge hover tooltip (invisible wider hit area + label)
    const edgeHitArea = linkLayer
      .selectAll(".edge-hit")
      .data(edgesCopy)
      .join("line")
      .attr("stroke", "transparent")
      .attr("stroke-width", 12)
      .attr("cursor", "default");

    // Tooltip element (shows on edge hover)
    const tooltip = d3Selection
      .select(svgRef.current.parentElement)
      .selectAll(".graph-tooltip")
      .data([null])
      .join("div")
      .attr("class", "graph-tooltip")
      .style("position", "absolute")
      .style("background", "hsl(var(--popover))")
      .style("color", "hsl(var(--popover-foreground))")
      .style("border", "1px solid hsl(var(--border))")
      .style("border-radius", "6px")
      .style("padding", "4px 8px")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("pointer-events", "none")
      .style("opacity", "0")
      .style("transition", "opacity 0.15s")
      .style("z-index", "10")
      .style("white-space", "nowrap");

    edgeHitArea
      .on("mouseover", function (event: MouseEvent, d: GraphEdge) {
        const cfg = EDGE_TYPE_CONFIG[d.relationshipType];
        tooltip
          .style("opacity", "1")
          .style("color", cfg?.color ?? "inherit")
          .text(cfg?.label ?? d.relationshipType);
      })
      .on("mousemove", function (event: MouseEvent) {
        const rect = svgRef.current!.parentElement!.getBoundingClientRect();
        tooltip
          .style("left", `${event.clientX - rect.left + 10}px`)
          .style("top", `${event.clientY - rect.top - 28}px`);
      })
      .on("mouseout", function () {
        tooltip.style("opacity", "0");
      });

    // Create nodes
    const node = nodeLayer.selectAll("g").data(nodesCopy).join("g").attr("cursor", "pointer");

    // Draw node shape based on noteType
    node.each(function (d: GraphNode) {
      const g = d3Selection.select(this);
      const cfg = NODE_TYPE_CONFIG[d.noteType] ?? NODE_TYPE_CONFIG.concept;
      const r = 30;

      if (cfg.shape === "circle") {
        g.append("circle")
          .attr("r", r)
          .attr("fill", cfg.fill)
          .attr("stroke", cfg.stroke)
          .attr("stroke-width", 2)
          .on("mouseover", function () {
            d3Selection
              .select(this)
              .transition()
              .duration(200)
              .attr("r", r + 3);
          })
          .on("mouseout", function () {
            d3Selection.select(this).transition().duration(200).attr("r", r);
          });
      } else if (cfg.shape === "rect") {
        g.append("rect")
          .attr("x", -r)
          .attr("y", -r * 0.75)
          .attr("width", r * 2)
          .attr("height", r * 1.5)
          .attr("rx", 6)
          .attr("fill", cfg.fill)
          .attr("stroke", cfg.stroke)
          .attr("stroke-width", 2)
          .on("mouseover", function () {
            d3Selection
              .select(this)
              .transition()
              .duration(200)
              .attr("x", -(r + 3))
              .attr("y", -(r + 3) * 0.75)
              .attr("width", (r + 3) * 2)
              .attr("height", (r + 3) * 1.5);
          })
          .on("mouseout", function () {
            d3Selection
              .select(this)
              .transition()
              .duration(200)
              .attr("x", -r)
              .attr("y", -r * 0.75)
              .attr("width", r * 2)
              .attr("height", r * 1.5);
          });
      } else if (cfg.shape === "diamond") {
        const size = r * 1.1;
        g.append("polygon")
          .attr("points", `0,${-size} ${size},0 0,${size} ${-size},0`)
          .attr("fill", cfg.fill)
          .attr("stroke", cfg.stroke)
          .attr("stroke-width", 2)
          .on("mouseover", function () {
            const s2 = size + 3;
            d3Selection
              .select(this)
              .transition()
              .duration(200)
              .attr("points", `0,${-s2} ${s2},0 0,${s2} ${-s2},0`);
          })
          .on("mouseout", function () {
            d3Selection
              .select(this)
              .transition()
              .duration(200)
              .attr("points", `0,${-size} ${size},0 0,${size} ${-size},0`);
          });
      }
    });

    // Text label
    node
      .append("text")
      .text((d: GraphNode) => d.label)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "hsl(var(--foreground))")
      .attr("font-size", "12px")
      .attr("font-weight", "600")
      .attr("pointer-events", "none");

    // Page number badge
    node
      .append("text")
      .text((d: GraphNode) => `p.${d.pageNumber}`)
      .attr("text-anchor", "middle")
      .attr("dy", "45")
      .attr("fill", "hsl(var(--muted-foreground))")
      .attr("font-size", "10px")
      .attr("pointer-events", "none");

    // Note type badge (below page number, colored)
    node
      .append("text")
      .text((d: GraphNode) => d.noteType)
      .attr("text-anchor", "middle")
      .attr("dy", "57")
      .attr("fill", (d: GraphNode) => NODE_TYPE_CONFIG[d.noteType]?.stroke ?? "#999")
      .attr("font-size", "9px")
      .attr("font-weight", "500")
      .attr("pointer-events", "none");

    // Click handler
    if (onNodeClick) {
      node.on("click", (event: MouseEvent, d: GraphNode) => {
        event.stopPropagation();
        onNodeClick(d.id);
      });
    }

    // Drag behavior
    const drag = d3Drag
      .drag<any, ForceNode>()
      .on("start", (event: any) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event: any) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", (event: any) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });

    node.call(drag);

    // Zoom behavior
    const zoom = d3Zoom
      .zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event: any) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Helper function to draw convex hulls around organization members
    const drawHulls = () => {
      // Remove old hulls
      hullLayer.selectAll("path").remove();
      hullLayer.selectAll("text").remove();

      // Store centroids for org-to-org links
      const orgCentroids = new Map<string, [number, number]>();

      organizations.forEach((org) => {
        // Get the positions of all member nodes
        const memberNodes = nodesCopy.filter((n) => org.memberIds.includes(n.id));
        if (memberNodes.length < 2) return; // Need at least 2 nodes for a hull

        // Get node positions with padding
        const points = memberNodes
          .filter((n) => n.x !== undefined && n.y !== undefined)
          .map((n) => [n.x!, n.y!] as [number, number]);

        if (points.length < 2) return;

        // Calculate convex hull
        const hull = d3Polygon.polygonHull(points);
        if (!hull) return;

        // Expand hull outward for padding
        const centroid = d3Polygon.polygonCentroid(hull);

        // Store centroid for org-to-org links
        orgCentroids.set(org.id, centroid);

        const paddedHull = hull.map((point) => {
          const dx = point[0] - centroid[0];
          const dy = point[1] - centroid[1];
          const distance = Math.sqrt(dx * dx + dy * dy);
          const padding = 50; // pixels of padding
          return [point[0] + (dx / distance) * padding, point[1] + (dy / distance) * padding];
        });

        // Draw the hull
        hullLayer
          .append("path")
          .datum(paddedHull)
          .attr("d", (d) => {
            return "M" + d.join("L") + "Z";
          })
          .attr("fill", org.color)
          .attr("fill-opacity", 0.15)
          .attr("stroke", org.color)
          .attr("stroke-width", 2)
          .attr("stroke-opacity", 0.5)
          .attr("stroke-dasharray", "5,5")
          .attr("rx", 20); // Rounded corners

        // Add organization label
        hullLayer
          .append("text")
          .attr("x", centroid[0])
          .attr("y", centroid[1] - d3Polygon.polygonLength(hull) / 4)
          .attr("text-anchor", "middle")
          .attr("fill", org.color)
          .attr("font-size", "14px")
          .attr("font-weight", "bold")
          .attr("opacity", 0.7)
          .text(org.name);
      });

      // Draw org-to-org links
      orgLinkLayer.selectAll("line").remove();
      orgLinkLayer.selectAll("text").remove();

      orgLinks.forEach((link) => {
        const sourceCentroid = orgCentroids.get(link.sourceOrgId);
        const targetCentroid = orgCentroids.get(link.targetOrgId);

        if (!sourceCentroid || !targetCentroid) return;

        // Draw the link line
        const isAlly = link.relationshipType === "ally";
        orgLinkLayer
          .append("line")
          .attr("x1", sourceCentroid[0])
          .attr("y1", sourceCentroid[1])
          .attr("x2", targetCentroid[0])
          .attr("y2", targetCentroid[1])
          .attr("stroke", isAlly ? "#10b981" : "#ef4444") // green for ally, red for enemy
          .attr("stroke-width", 3)
          .attr("stroke-opacity", 0.6)
          .attr("stroke-dasharray", isAlly ? "0" : "10,5"); // solid for ally, dashed for enemy

        // Add relationship label at midpoint
        const midX = (sourceCentroid[0] + targetCentroid[0]) / 2;
        const midY = (sourceCentroid[1] + targetCentroid[1]) / 2;

        orgLinkLayer
          .append("text")
          .attr("x", midX)
          .attr("y", midY - 5)
          .attr("text-anchor", "middle")
          .attr("fill", isAlly ? "#10b981" : "#ef4444")
          .attr("font-size", "11px")
          .attr("font-weight", "bold")
          .attr("opacity", 0.8)
          .style("text-shadow", "0 0 3px white, 0 0 3px white")
          .text(isAlly ? "ALLY" : "ENEMY");
      });
    };

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      edgeHitArea
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);

      // Redraw hulls on every tick to follow nodes
      drawHulls();
    });

    return () => {
      simulation.stop();
      // Clean up tooltip
      d3Selection
        .select(svgRef.current?.parentElement ?? document.body)
        .selectAll(".graph-tooltip")
        .remove();
    };
  }, [nodes, edges, organizations, orgLinks, onNodeClick]);

  return (
    <Card className="p-4">
      <div className="relative">
        <svg
          ref={svgRef}
          width="100%"
          height="600"
          viewBox="0 0 800 600"
          className="border-border bg-background rounded-lg border"
        />
        {/* Legend */}
        <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
          <span className="text-foreground font-semibold">Relationships:</span>
          {(
            Object.entries(EDGE_TYPE_CONFIG) as [
              RelationshipType,
              (typeof EDGE_TYPE_CONFIG)[RelationshipType],
            ][]
          ).map(([type, cfg]) => (
            <span key={type} className="flex items-center gap-1">
              <svg width="24" height="10">
                <line
                  x1="0"
                  y1="5"
                  x2="24"
                  y2="5"
                  stroke={cfg.color}
                  strokeWidth="2"
                  strokeDasharray={cfg.dashArray}
                />
                {cfg.directed && <polygon points="18,2 24,5 18,8" fill={cfg.color} />}
              </svg>
              {cfg.label}
            </span>
          ))}
        </div>
        <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-6 gap-y-2 text-xs">
          <span className="text-foreground font-semibold">Note types:</span>
          {(
            Object.entries(NODE_TYPE_CONFIG) as [NoteType, (typeof NODE_TYPE_CONFIG)[NoteType]][]
          ).map(([type, cfg]) => (
            <span key={type} className="flex items-center gap-1">
              <svg width="14" height="14">
                {cfg.shape === "circle" && (
                  <circle
                    cx="7"
                    cy="7"
                    r="6"
                    fill={cfg.fill}
                    stroke={cfg.stroke}
                    strokeWidth="1.5"
                  />
                )}
                {cfg.shape === "rect" && (
                  <rect
                    x="1"
                    y="2"
                    width="12"
                    height="10"
                    rx="2"
                    fill={cfg.fill}
                    stroke={cfg.stroke}
                    strokeWidth="1.5"
                  />
                )}
                {cfg.shape === "diamond" && (
                  <polygon
                    points="7,1 13,7 7,13 1,7"
                    fill={cfg.fill}
                    stroke={cfg.stroke}
                    strokeWidth="1.5"
                  />
                )}
              </svg>
              {type}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
