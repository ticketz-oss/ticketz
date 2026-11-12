# ActionCard Component

A reusable card component with a popover action menu for consistent card layouts across the application.

## Features

- Consistent card styling with hover effects
- Popover menu (ellipsis icon) at the top right corner
- Built-in title with configurable overflow (ellipsis or wrap)
- Optional status chip in the header
- Configurable actions (React elements or icon + label objects)
- Optional card click handler
- Support for dividers between action groups

## Usage

### Basic Usage

```jsx
import ActionCard from "../components/ActionCard";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";

<ActionCard
  title="Company Name"
  titleEllipsis
  statusChip={{
    label: "Active",
    className: classes.statusActive
  }}
  actions={[
    {
      icon: <EditIcon />,
      label: "Edit",
      onClick: () => handleEdit(item)
    },
    {
      icon: <DeleteIcon />,
      label: "Delete",
      onClick: () => handleDelete(item)
    }
  ]}
  onClick={() => handleCardClick(item)}
>
  <Typography variant="body2">{item.description}</Typography>
</ActionCard>
```

### Title Overflow Options

```jsx
// Ellipsis overflow (single line, truncate with ...)
<ActionCard title="Long Title" titleEllipsis>
  {/* content */}
</ActionCard>

// Wrap (default, allows multiple lines)
<ActionCard title="Long Title That Wraps">
  {/* content */}
</ActionCard>
```

### Without Status Chip

```jsx
<ActionCard title="Simple Card" actions={actions}>
  {/* content */}
</ActionCard>
```

### With Dividers

```jsx
<ActionCard
  title="Card with Dividers"
  actions={[
    {
      icon: <EditIcon />,
      label: "Edit",
      onClick: () => handleEdit(item)
    },
    { divider: true },
    {
      icon: <DeleteIcon />,
      label: "Delete",
      onClick: () => handleDelete(item)
    }
  ]}
>
  {/* content */}
</ActionCard>
```

### With Custom React Elements

```jsx
<ActionCard
  title="Custom Actions"
  actions={[
    <MenuItem key="custom" onClick={handleCustom}>
      <ListItemIcon>
        <CustomIcon />
      </ListItemIcon>
      <ListItemText>Custom Action</ListItemText>
    </MenuItem>
  ]}
>
  {/* content */}
</ActionCard>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `node` | required | Card content |
| `actions` | `array` | `[]` | Array of action objects or React elements |
| `onClick` | `func` | `null` | Card click handler |
| `className` | `string` | `""` | Additional CSS class |
| `title` | `string` | `null` | Card title displayed in header |
| `titleEllipsis` | `bool` | `false` | If true, title truncates with ellipsis; otherwise wraps |
| `statusChip` | `object` | `null` | Optional status chip props (label, className, etc.) |
| `cardProps` | `object` | `{}` | Props passed to the Card component |
| `contentProps` | `object` | `{}` | Props passed to the CardContent component |
| `data-testid` | `string` | `undefined` | Test ID for testing |

### Action Object Shape

```javascript
{
  icon: PropTypes.element,      // Icon element to display
  label: PropTypes.string,      // Action label text
  onClick: PropTypes.func,      // Click handler
  disabled: PropTypes.bool,     // Disable the action
  divider: PropTypes.bool       // Set to true to render a divider
}
```

### Status Chip Shape

```javascript
{
  label: PropTypes.node,        // Chip label
  className: PropTypes.string   // Additional CSS class for styling
}
```

## Examples in Codebase

- `CompaniesManager` - Company cards with title, status chip, and actions (edit, delete, impersonate)
- `Connections` - WhatsApp connection cards with title, status chip, and status-specific actions
