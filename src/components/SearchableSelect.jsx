import { useState, useRef, useEffect, useMemo } from "react";

/**
 * Reusable classic & professional Searchable Select / Dropdown component.
 * Supports searching options, custom scrollable dropdown list, click outside handling,
 * and keyboard navigation.
 */
export default function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  loading = false,
  disabled = false,
  className = "",
  style = {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options to { value, label } format
  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "object" && opt !== null) {
        return {
          value: opt.value ?? opt.id ?? "",
          label: opt.label ?? opt.schoolName ?? opt.name ?? String(opt.value ?? opt.id ?? ""),
          raw: opt,
        };
      }
      return { value: String(opt), label: String(opt), raw: opt };
    });
  }, [options]);

  // Selected option
  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => String(opt.value) === String(value));
  }, [normalizedOptions, value]);

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const query = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter((opt) =>
      opt.label.toLowerCase().includes(query)
    );
  }, [normalizedOptions, searchQuery]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Handle keyboard events (Escape to close)
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (optValue, rawOpt) => {
    onChange && onChange(optValue, rawOpt);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`searchable-select-container ${isOpen ? "is-open" : ""} ${disabled ? "is-disabled" : ""} ${className}`}
      style={style}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        className="searchable-select-trigger"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
      >
        <span className={`trigger-label ${!selectedOption ? "is-placeholder" : ""}`}>
          {loading
            ? "Loading..."
            : selectedOption
            ? selectedOption.label
            : placeholder}
        </span>
        <i className={`bi bi-chevron-down trigger-arrow ${isOpen ? "open" : ""}`} />
      </button>

      {isOpen && (
        <div className="searchable-select-dropdown">
          <div className="searchable-select-search">
            <i className="bi bi-search search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
              >
                <i className="bi bi-x" />
              </button>
            )}
          </div>

          <div className="searchable-select-options">
            {loading ? (
              <div className="searchable-select-status">Loading options...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="searchable-select-status">No matching options</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={opt.value}
                    className={`searchable-select-option ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelect(opt.value, opt.raw)}
                  >
                    <span className="option-label">{opt.label}</span>
                    {isSelected && <i className="bi bi-check2 check-icon" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
