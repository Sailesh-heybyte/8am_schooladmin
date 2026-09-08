import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  getRoute,
  addStopToRoute,
  reorderRouteStops,
  removeStopFromRoute,
} from "../../api/routes.js";
import { getStops } from "../../api/stops.js";
import "../Roles/RoleModal.scss";

function SortableStopRow({
  stop,
  index,
  total,
  disabled,
  onMoveUp,
  onMoveDown,
  onRemove,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`route-stop-item ${isDragging ? "dragging" : ""}`}
    >
      <button
        type="button"
        className="stop-grip"
        title="Drag to reorder"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <i className="bi bi-grip-vertical"></i>
      </button>

      <span className="stop-seq">{index + 1}</span>

      <span className="stop-title">{stop.stopName}</span>

      <div className="stop-actions">
        <button
          type="button"
          className="stop-btn arrow"
          title="Move up"
          onClick={() => onMoveUp(index)}
          disabled={disabled || index === 0}
        >
          <i className="bi bi-arrow-up"></i>
        </button>

        <button
          type="button"
          className="stop-btn arrow"
          title="Move down"
          onClick={() => onMoveDown(index)}
          disabled={disabled || index === total - 1}
        >
          <i className="bi bi-arrow-down"></i>
        </button>

        <button
          type="button"
          className="stop-btn remove"
          title="Remove stop from route"
          onClick={() => onRemove(stop)}
          disabled={disabled}
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>
    </div>
  );
}

export default function RouteStopsModal({
  isOpen,
  route,
  onClose,
  onSaved,
}) {
  const [allStops, setAllStops] = useState([]);
  const [orderedStops, setOrderedStops] = useState([]);
  const [initialStopIds, setInitialStopIds] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [selectedStopIdToAdd, setSelectedStopIdToAdd] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const [stopToRemove, setStopToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const [hasChangedAnything, setHasChangedAnything] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load route detail and all stops on open
  useEffect(() => {
    if (!isOpen || !route?.id) return;

    let isMounted = true;
    setLoading(true);
    setLoadError("");
    setActionError("");
    setSelectedStopIdToAdd("");
    setStopToRemove(null);
    setHasChangedAnything(false);

    Promise.all([getRoute(route.id), getStops()])
      .then(([routeDetail, stopsList]) => {
        if (!isMounted) return;
        const currentStops = routeDetail.stops || [];
        setOrderedStops(currentStops);
        setInitialStopIds(currentStops.map((s) => s.id));
        setAllStops(stopsList || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoadError(err.message || "Failed to load route stops.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, route?.id]);

  if (!isOpen || !route) return null;

  // Determine if order changed relative to initialStopIds
  const currentIds = orderedStops.map((s) => s.id);
  const hasUnsavedOrder =
    currentIds.length === initialStopIds.length &&
    currentIds.length > 0 &&
    currentIds.some((id, idx) => id !== initialStopIds[idx]);

  // Stops available to add (not already on route)
  const availableStopsToAdd = allStops.filter(
    (s) => !orderedStops.some((os) => os.id === s.id)
  );

  const isBusy = loading || isAdding || isSavingOrder || isRemoving;

  const handleClose = () => {
    if (hasChangedAnything && onSaved) {
      onSaved();
    }
    onClose();
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedStops((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    setOrderedStops((items) => arrayMove(items, index, index - 1));
  };

  const handleMoveDown = (index) => {
    if (index >= orderedStops.length - 1) return;
    setOrderedStops((items) => arrayMove(items, index, index + 1));
  };

  const handleAddStop = async (e) => {
    e.preventDefault();
    if (!selectedStopIdToAdd) return;

    setIsAdding(true);
    setActionError("");

    try {
      const updatedRoute = await addStopToRoute(route.id, selectedStopIdToAdd);
      const nextStops = updatedRoute.stops || [];
      setOrderedStops(nextStops);
      setInitialStopIds(nextStops.map((s) => s.id));
      setSelectedStopIdToAdd("");
      setHasChangedAnything(true);
    } catch (err) {
      setActionError(err.message || "Failed to add stop to route.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    setActionError("");

    try {
      const updatedRoute = await reorderRouteStops(route.id, currentIds);
      const nextStops = updatedRoute.stops || [];
      setOrderedStops(nextStops);
      setInitialStopIds(nextStops.map((s) => s.id));
      setHasChangedAnything(true);
    } catch (err) {
      setActionError(err.message || "Failed to save stop order.");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!stopToRemove) return;

    setIsRemoving(true);
    setActionError("");

    try {
      const updatedRoute = await removeStopFromRoute(route.id, stopToRemove.id);
      const nextStops = updatedRoute.stops || [];
      setOrderedStops(nextStops);
      setInitialStopIds(nextStops.map((s) => s.id));
      setStopToRemove(null);
      setHasChangedAnything(true);
    } catch (err) {
      setActionError(err.message || "Failed to remove stop from route.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="add-user-overlay" onMouseDown={!isBusy ? handleClose : undefined}>
      <div
        className="add-user-modal route-stops-modal-container"
        style={{ width: "42rem" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="add-user-header">
          <div>
            <h2>Manage Route Stops</h2>
            <p>Route: <strong>{route.routeName}</strong></p>
          </div>
          <button
            type="button"
            className="add-user-close"
            onClick={handleClose}
            disabled={isBusy}
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="add-user-body" style={{ padding: "1.25rem 1.5rem" }}>
          {/* Add Stop Section */}
          <form onSubmit={handleAddStop} className="route-stops-add-bar">
            <div style={{ flex: 1 }}>
              <select
                value={selectedStopIdToAdd}
                onChange={(e) => setSelectedStopIdToAdd(e.target.value)}
                disabled={isBusy || availableStopsToAdd.length === 0}
                style={{ width: "100%", height: "2.35rem" }}
              >
                {availableStopsToAdd.length === 0 ? (
                  <option value="" disabled>
                    All stops are on this route
                  </option>
                ) : (
                  <>
                    <option value="">Select a stop to add...</option>
                    {availableStopsToAdd.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.stopName}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <button
              type="submit"
              className="modal-save"
              style={{ height: "2.35rem", padding: "0 1.25rem", whiteSpace: "nowrap" }}
              disabled={isBusy || !selectedStopIdToAdd}
            >
              {isAdding ? "Adding..." : "+ Add Stop"}
            </button>
          </form>

          {loadError && (
            <div className="add-user-error" style={{ margin: "1rem 0" }}>
              {loadError}
            </div>
          )}

          {actionError && (
            <div className="add-user-error" style={{ margin: "1rem 0" }}>
              {actionError}
            </div>
          )}

          {/* Stops List */}
          <div className="route-stops-list-wrapper">
            <div className="route-stops-list-header">
              <span>ORDERED STOPS ({orderedStops.length})</span>
              {hasUnsavedOrder && (
                <span className="unsaved-badge">
                  <i className="bi bi-exclamation-circle"></i> Unsaved order changes
                </span>
              )}
            </div>

            {loading ? (
              <div className="stops-empty-box">
                <div className="state-spinner" style={{ width: "1.8rem", height: "1.8rem", margin: "0 auto 0.5rem" }}></div>
                <p>Loading route stops...</p>
              </div>
            ) : orderedStops.length === 0 ? (
              <div className="stops-empty-box">
                <i className="bi bi-signpost-split" style={{ fontSize: "1.8rem", color: "#98A2B3", marginBottom: "0.4rem" }}></i>
                <p>No stops on this route yet.</p>
                <small style={{ color: "#667085" }}>Select a stop above to add it to this route.</small>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={orderedStops.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="route-stops-draggable-list">
                    {orderedStops.map((stop, idx) => (
                      <SortableStopRow
                        key={stop.id}
                        stop={stop}
                        index={idx}
                        total={orderedStops.length}
                        disabled={isBusy}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        onRemove={setStopToRemove}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Unsaved Order Save Banner */}
          {hasUnsavedOrder && (
            <div className="unsaved-order-footer-bar">
              <div>
                <strong>Order changed</strong>
                <p>Save the new stop sequence to update the route navigation.</p>
              </div>
              <button
                type="button"
                className="modal-save"
                onClick={handleSaveOrder}
                disabled={isBusy}
              >
                {isSavingOrder ? "Saving order..." : "Save order"}
              </button>
            </div>
          )}
        </div>

        <div className="add-user-footer">
          <button
            type="button"
            className="modal-cancel"
            onClick={handleClose}
            disabled={isBusy}
          >
            Close
          </button>
        </div>
      </div>

      {/* Remove Stop Confirmation Modal */}
      {stopToRemove && (
        <div
          className="add-user-overlay"
          style={{ zIndex: 1100 }}
          onMouseDown={() => !isRemoving && setStopToRemove(null)}
        >
          <div
            className="add-user-modal"
            style={{ width: "28rem" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="add-user-header">
              <div>
                <h2>Remove Stop</h2>
                <p>{stopToRemove.stopName}</p>
              </div>
              <button
                type="button"
                className="add-user-close"
                onClick={() => setStopToRemove(null)}
                disabled={isRemoving}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="add-user-body" style={{ padding: "1.25rem" }}>
              <p style={{ margin: 0, color: "#475467", fontSize: "0.85rem", lineHeight: 1.5 }}>
                Remove <strong>{stopToRemove.stopName}</strong> from this route? The stop stays in the system.
              </p>
              {hasUnsavedOrder && (
                <div
                  className="add-user-error"
                  style={{
                    marginTop: "0.85rem",
                    background: "#FEF0C7",
                    borderColor: "#FEDF89",
                    color: "#B54708",
                  }}
                >
                  <i className="bi bi-exclamation-triangle" style={{ marginRight: "0.4rem" }}></i>
                  Warning: Removing this stop will discard any unsaved order changes.
                </div>
              )}
            </div>

            <div className="add-user-footer">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => setStopToRemove(null)}
                disabled={isRemoving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-save"
                style={{ background: "#d9534f", borderColor: "#d9534f" }}
                onClick={handleConfirmRemove}
                disabled={isRemoving}
              >
                {isRemoving ? "Removing..." : "Remove Stop"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
