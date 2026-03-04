import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useStore } from "@livestore/react";
import { queryDb } from "@livestore/livestore";
import { tables } from "@/livestore/schema";
import { useBookProgress } from "@/contexts/BookProgressContext";
import { CharacterGraph } from "@/components/graph/CharacterGraph";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState } from "react";
import type { RelationshipType } from "@marginelle/schema";

export const Route = createFileRoute("/_authenticated/books/$bookId/graph")({
  component: GraphViewPage,
});

function GraphViewPage() {
  const { bookId } = Route.useParams();
  const { store } = useStore();
  const { currentPage, setCurrentPage, maxPage } = useBookProgress();
  const navigate = useNavigate();
  const [sliderValue, setSliderValue] = useState<number[]>([currentPage || 1]);

  // Query all notes for book
  const notes$ = queryDb(() => tables.notes.where({ bookId, deletedAt: null }), {
    label: `notes-for-book-${bookId}`,
  });
  const allNotes = store.useQuery(notes$);

  // Query all relationships
  const relationships$ = queryDb(() => tables.noteRelationships.where({ deletedAt: null }), {
    label: `relationships-all`,
  });
  const allRelationships = store.useQuery(relationships$);

  // 1. Separate organization notes for hull rendering; all other notes become graph nodes
  const organizationNotes = (allNotes || []).filter((note) => note.type === "organization");
  const nonOrgNotes = (allNotes || []).filter((note) => note.type !== "organization");

  // 2. Apply temporal filtering (reading progress)
  const visibleNodes = currentPage
    ? nonOrgNotes.filter((note) => note.pageNumber <= currentPage)
    : nonOrgNotes;

  const visibleOrganizations = currentPage
    ? organizationNotes.filter((note) => note.pageNumber <= currentPage)
    : organizationNotes;

  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

  // 3. Temporal filter all relationships
  const temporalRelationships = (allRelationships || []).filter((r) =>
    currentPage ? r.pageNumber <= currentPage : true,
  );

  // 4. member_of relationships drive org hull membership (not rendered as edges)
  const memberOfRelationships = temporalRelationships.filter(
    (r) => r.relationshipType === "member_of",
  );

  // 5. ally/enemy between organizations → org-to-org link lines
  const visibleOrgIds = new Set(visibleOrganizations.map((o) => o.id));
  const orgToOrgRelationships = temporalRelationships.filter(
    (r) =>
      (r.relationshipType === "ally" || r.relationshipType === "enemy") &&
      visibleOrgIds.has(r.fromNoteId) &&
      visibleOrgIds.has(r.toNoteId),
  );

  // 6. All other relationships become graph edges (both endpoints must be visible nodes)
  const visibleEdges = temporalRelationships.filter(
    (r) =>
      r.relationshipType !== "member_of" &&
      !(
        (r.relationshipType === "ally" || r.relationshipType === "enemy") &&
        visibleOrgIds.has(r.fromNoteId) &&
        visibleOrgIds.has(r.toNoteId)
      ) &&
      visibleNodeIds.has(r.fromNoteId) &&
      visibleNodeIds.has(r.toNoteId),
  );

  // 7. Build organization groups with member lists (character nodes only for hull)
  const visibleCharacterIds = new Set(
    visibleNodes.filter((n) => n.type === "character").map((n) => n.id),
  );
  const organizationGroups = visibleOrganizations
    .map((org, index) => {
      const memberIds = memberOfRelationships
        .filter((r) => r.toNoteId === org.id && visibleCharacterIds.has(r.fromNoteId))
        .map((r) => r.fromNoteId);

      const colors = [
        "#3b82f6", // blue
        "#10b981", // green
        "#f59e0b", // amber
        "#8b5cf6", // purple
        "#ef4444", // red
        "#06b6d4", // cyan
        "#ec4899", // pink
      ];

      return {
        id: org.id,
        name: org.title,
        memberIds,
        pageNumber: org.pageNumber,
        color: colors[index % colors.length],
      };
    })
    .filter((org) => org.memberIds.length >= 2); // Only show orgs with 2+ members

  // 8. Build org-to-org links
  const visibleOrgGroupIds = new Set(organizationGroups.map((o) => o.id));
  const orgLinks = orgToOrgRelationships
    .filter((r) => visibleOrgGroupIds.has(r.fromNoteId) && visibleOrgGroupIds.has(r.toNoteId))
    .map((r) => ({
      sourceOrgId: r.fromNoteId,
      targetOrgId: r.toNoteId,
      relationshipType: r.relationshipType as "ally" | "enemy",
      pageNumber: r.pageNumber,
    }));

  // 9. Transform to graph format
  const nodes = visibleNodes.map((note) => ({
    id: note.id,
    label: note.title,
    pageNumber: note.pageNumber,
    noteType: note.type,
  }));

  const edges = visibleEdges.map((rel) => ({
    source: rel.fromNoteId,
    target: rel.toNoteId,
    pageNumber: rel.pageNumber,
    relationshipType: rel.relationshipType as RelationshipType,
  }));

  // Handle node click
  const handleNodeClick = (nodeId: string) => {
    navigate({
      to: "/books/$bookId/notes/$noteId",
      params: { bookId, noteId: nodeId },
    });
  };

  // Handle slider for progress
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
  };

  const handleSliderCommit = (value: number[]) => {
    const roundedPage = Math.round(value[0]);
    setSliderValue([roundedPage]);
    setCurrentPage(roundedPage);
  };

  // No notes at all (excluding orgs)
  if (nonOrgNotes.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>No notes yet for this book.</p>
        <p className="mt-2 text-sm">
          Create character, event, location, item, or concept notes to see the relationship graph.
        </p>
      </div>
    );
  }

  // Notes exist but none visible at current page
  if (currentPage && visibleNodes.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>No notes discovered yet at page {currentPage}.</p>
        <p className="mt-2 text-sm">Total notes in book: {nonOrgNotes.length}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Graph */}
      <div className="space-y-4">
        {/* Temporal filtering indicator */}
        {currentPage && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm">
            <p className="text-green-800">
              Showing {nodes.length} note{nodes.length !== 1 ? "s" : ""}, {edges.length}{" "}
              relationship{edges.length !== 1 ? "s" : ""}, and {organizationGroups.length}{" "}
              organization{organizationGroups.length !== 1 ? "s" : ""} discovered by page{" "}
              {currentPage}
            </p>
          </div>
        )}

        <CharacterGraph
          nodes={nodes}
          edges={edges}
          organizations={organizationGroups}
          orgLinks={orgLinks}
          onNodeClick={handleNodeClick}
        />
      </div>

      {/* Reading Progress Control - Below Graph */}
      <Card className="bg-accent/10 border-accent/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Reading Progress</CardTitle>
            <div className="text-muted-foreground text-sm">
              {currentPage ? (
                <span>
                  Page <strong>{Math.round(sliderValue[0])}</strong>{" "}
                  {Math.round(sliderValue[0]) !== currentPage && "(drag to update)"}
                </span>
              ) : (
                <span>Set your reading progress</span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground w-8 text-sm">1</span>
            <Slider
              value={sliderValue}
              onValueChange={handleSliderChange}
              onValueCommit={handleSliderCommit}
              min={1}
              max={maxPage || 100}
              className="flex-1"
            />
            <span className="text-muted-foreground w-12 text-sm">{maxPage || "?"}</span>
          </div>

          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>Start of book</span>
            {maxPage && (
              <button
                onClick={() => {
                  setSliderValue([maxPage]);
                  setCurrentPage(maxPage);
                }}
                className="text-primary hover:text-primary/80 underline"
              >
                Jump to Latest (p.{maxPage})
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - At Bottom */}
      <div className="flex justify-end gap-2">
        <Button asChild variant="outline">
          <Link to="/books/$bookId/notes" params={{ bookId }}>
            Back to Notes
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/books/$bookId/notes/new" params={{ bookId }}>
            Create New Note
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/books/$bookId/notes/relationships/new" params={{ bookId }}>
            Create Relationship
          </Link>
        </Button>
      </div>
    </div>
  );
}
