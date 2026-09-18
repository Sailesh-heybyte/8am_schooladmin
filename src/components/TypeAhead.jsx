import { useState, useRef, useEffect, useMemo } from "react";
import "./TypeAhead.scss";

export default function TypeAhead({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option",
  disabled = false,
  loading = false,
  emptyMessage = "No options available",
  noMatchMessage = "No results found",
  className = "",
  style = {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "object" && opt !== null) {
        return {
          value: opt.value ?? opt.id ?? "",
          label:
            opt.label ??
            opt.name ??
            opt.schoolName ??
            String(opt.value ?? opt.id ?? ""),
          raw: opt,
        };
      }
      return { value: String(opt), label: String(opt), raw: opt };
    });
  }, [options]);

  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  const selectedOptionRef = useRef(selectedOption);
  useEffect(() => {
    selectedOptionRef.current = selectedOption;
  }, [selectedOption]);

  // Keep input text in sync with selected option when panel is closed
  useEffect(() => {
    if (!isOpen) {
      setSearchText(selectedOption ? selectedOption.label : "");
    }
  }, [isOpen, selectedOption]);

  // Close on any interaction outside the component, by mouse OR by keyboard.
  // mousedown covers clicking elsewhere on the page.
  // focusin covers tabbing to another field, which fires no click at all.
  useEffect(() => {
    const closeIfOutside = (event) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target)) return;
      setIsOpen(false);
      setSearchText(
        selectedOptionRef.current ? selectedOptionRef.current.label : ""
      );
      setHighlightedIndex(-1);
    };

    document.addEventListener("mousedown", closeIfOutside);
    document.addEventListener("focusin", closeIfOutside);
    return () => {
      document.removeEventListener("mousedown", closeIfOutside);
      document.removeEventListener("focusin", closeIfOutside);
    };
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchText.trim()) return normalizedOptions;
    const query = searchText.toLowerCase().trim();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(query)
    );
  }, [normalizedOptions, searchText]);

  const visibleOptions = filteredOptions.slice(0, 50);
  const hasMore = filteredOptions.length > 50;

  const handleOpen = () => {
    if (disabled || isOpen) return;
    setIsOpen(true);
    setSearchText("");
    setHighlightedIndex(-1);
  };

  const closeAndRestore = () => {
    setIsOpen(false);
    setSearchText(selectedOption ? selectedOption.label : "");
    setHighlightedIndex(-1);
  };

  const handleSelect = (option) => {
    onChange && onChange(option.value);
    setSearchText(option.label);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange && onChange("");
    setSearchText("");
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        handleOpen();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        if (visibleOptions.length === 0) return -1;
        return prev < visibleOptions.length - 1 ? prev + 1 : 0;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => {
        if (visibleOptions.length === 0) return -1;
        return prev > 0 ? prev - 1 : visibleOptions.length - 1;
      });
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < visibleOptions.length) {
        handleSelect(visibleOptions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeAndRestore();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`typeahead-container ${isOpen ? "is-open" : ""} ${
        disabled ? "is-disabled" : ""
      } ${className}`.trim()}
      style={style}
    >
      <div className="typeahead-control">
        <input
          ref={inputRef}
          type="text"
          className="typeahead-input"
          value={searchText}
          placeholder={placeholder}
          disabled={disabled}
          onClick={handleOpen}
          onFocus={handleOpen}
          onChange={(e) => {
            setSearchText(e.target.value);
            if (!isOpen) setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />

        <div className="typeahead-actions">
          {Boolean(value) && !disabled && (
            <button
              type="button"
              className="typeahead-clear"
              onClick={handleClear}
              aria-label="Clear selection"
            >
              <i className="bi bi-x" />
            </button>
          )}
          <i
            className={`bi bi-chevron-down typeahead-chevron ${
              isOpen ? "is-open" : ""
            }`}
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="typeahead-dropdown">
          <div className="typeahead-options">
            {loading ? (
              <div className="typeahead-status">Loading options...</div>
            ) : normalizedOptions.length === 0 ? (
              <div className="typeahead-status">{emptyMessage}</div>
            ) : filteredOptions.length === 0 ? (
              <div className="typeahead-status">{noMatchMessage}</div>
            ) : (
              <>
                {visibleOptions.map((opt, index) => {
                  const isSelected = String(opt.value) === String(value);
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <div
                      key={opt.value}
                      className={`typeahead-option ${
                        isSelected ? "is-selected" : ""
                      } ${isHighlighted ? "is-highlighted" : ""}`}
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                    >
                      <span className="typeahead-label">{opt.label}</span>
                      {isSelected && <i className="bi bi-check2 check-icon" />}
                    </div>
                  );
                })}

                {hasMore && (
                  <div className="typeahead-more">
                    Showing 50 of {filteredOptions.length} results. Keep typing
                    to narrow down.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}