export type AutocompleteOption = {
  value: string;
  label?: string;
};

type NativeAutocompleteProps = {
  value: string;
  options: readonly AutocompleteOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
};

export function NativeAutocomplete({
  value,
  options,
  onChange,
  placeholder,
  id,
  name,
  disabled,
}: NativeAutocompleteProps) {
  const listId = `${id ?? name ?? "autocomplete"}-list`;

  return (
    <>
      <input
        type="text"
        list={listId}
        id={id}
        name={name}
        value={value}
        className="autocomplete-input"
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />

      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </datalist>
    </>
  );
}
