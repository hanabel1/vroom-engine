# Plugin Architecture Diagrams

## System Architecture

```mermaid
graph TB
    subgraph "Figma Desktop App"
        subgraph "UI Iframe (React)"
            A[SearchBar Component]
            B[ResultsList Component]
            C[useSearch Hook<br/>Fuse.js]
            D[usePluginMessage Hook<br/>postMessage]
        end
        
        subgraph "Plugin Main Thread (No DOM)"
            E[main.ts<br/>Message Handler]
            F[Catalog Loader<br/>3 JSON files]
            G[HTML to Figma Converter]
            H[Figma API<br/>createFrame, createText]
        end
        
        I[Figma Canvas]
    end
    
    A -->|user types| C
    C -->|fuzzy search| B
    B -->|Place click| D
    D <-->|postMessage| E
    E --> F
    F -->|catalog data| D
    E --> G
    G --> H
    H -->|create nodes| I
    
    style A fill:#e1f5ff
    style B fill:#e1f5ff
    style C fill:#fff3e0
    style D fill:#fff3e0
    style E fill:#f3e5f5
    style F fill:#f3e5f5
    style G fill:#f3e5f5
    style H fill:#f3e5f5
    style I fill:#e8f5e9
```

## Message Protocol Flow

```mermaid
sequenceDiagram
    participant UI as UI Iframe<br/>(React)
    participant Plugin as Plugin Main<br/>(Figma API)
    participant Figma as Figma Canvas
    
    Note over UI,Plugin: Plugin Initialization
    UI->>Plugin: PLUGIN_READY
    activate Plugin
    Plugin->>Plugin: Load catalog JSONs
    Plugin->>UI: CATALOG_DATA<br/>{designSystems: [...]}
    deactivate Plugin
    
    Note over UI: User builds Fuse.js index
    
    Note over UI,Figma: Search Flow
    UI->>UI: User types "button"
    UI->>UI: Fuse.js fuzzy search
    UI->>UI: Display results
    
    Note over UI,Figma: Placement Flow
    UI->>Plugin: PLACE_COMPONENT<br/>{html, designSystemId, componentId}
    activate Plugin
    Plugin->>UI: PLACEMENT_STARTED
    
    Plugin->>Plugin: Parse HTML
    Plugin->>Plugin: Map to Figma nodes
    Plugin->>Figma: Create frames & text nodes
    Plugin->>Figma: Apply Auto Layout
    Plugin->>Figma: Select & scroll into view
    
    Plugin->>UI: PLACEMENT_COMPLETE<br/>{nodeName, warnings: [...]}
    deactivate Plugin
```

## Search Workflow

```mermaid
flowchart LR
    A[User Types Query] --> B{Query Empty?}
    B -->|Yes| C[Show All Components<br/>15 total]
    B -->|No| D[Fuse.js Search]
    
    D --> E[Search Keys:<br/>• name weight: 2.0<br/>• aliases weight: 1.5<br/>• category weight: 0.8<br/>• designSystem weight: 0.5<br/>• props.name weight: 0.7]
    
    E --> F{Results Found?}
    F -->|Yes| G[Group by Design System]
    F -->|No| H[Show Empty State<br/>with suggestions]
    
    G --> I[Display ResultCards<br/>with Place buttons]
    
    style A fill:#e1f5ff
    style D fill:#fff3e0
    style E fill:#fff3e0
    style G fill:#e8f5e9
    style I fill:#e8f5e9
    style H fill:#ffebee
```

## Component Placement Workflow

```mermaid
flowchart TB
    A[User Clicks Place] --> B[Send PLACE_COMPONENT<br/>message]
    B --> C[Plugin receives HTML string]
    
    C --> D[HTML Parser<br/>DOMParser]
    D --> E[Parse Tree]
    
    E --> F{Element Type?}
    F -->|Text| G[Create TextNode<br/>Load font<br/>Apply styles]
    F -->|Container| H[Create FrameNode<br/>Apply background<br/>Apply border]
    
    H --> I{Has flex?}
    I -->|Yes| J[Apply Auto Layout<br/>• layoutMode<br/>• spacing<br/>• padding<br/>• alignment]
    I -->|No| K[Fixed sizing]
    
    J --> L[Process Children<br/>Recursively]
    K --> L
    G --> L
    
    L --> M{Has Children?}
    M -->|Yes| N[Append child nodes]
    M -->|No| O[Complete]
    
    N --> O
    O --> P[Add to Figma Canvas]
    P --> Q[Select & Zoom Into View]
    Q --> R[Send PLACEMENT_COMPLETE]
    
    style A fill:#e1f5ff
    style C fill:#fff3e0
    style D fill:#fff3e0
    style J fill:#e8f5e9
    style P fill:#e8f5e9
    style Q fill:#e8f5e9
    style R fill:#c8e6c9
```

## Data Flow

```mermaid
graph LR
    subgraph "Catalog Data"
        A[mui-v5.json<br/>5 components]
        B[spectrum.json<br/>5 components]
        C[tailwind-ui.json<br/>5 components]
    end
    
    subgraph "Plugin Main Thread"
        D[Load at startup]
        E[Flatten components]
    end
    
    subgraph "UI Iframe"
        F[Receive via<br/>CATALOG_DATA]
        G[Build Fuse.js Index<br/>15 searchable items]
        H[Search Results]
    end
    
    subgraph "User Actions"
        I[Type Query]
        J[Click Place]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    I --> G
    G --> H
    J --> K[HTML Converter]
    K --> L[Figma Canvas]
    
    style A fill:#bbdefb
    style B fill:#bbdefb
    style C fill:#bbdefb
    style G fill:#fff3e0
    style K fill:#f3e5f5
    style L fill:#e8f5e9
```

## CSS to Figma Mapping

```mermaid
flowchart LR
    subgraph "CSS Properties"
        A["display: flex"]
        B["background-color: #1976d2"]
        C["padding: 6px 16px"]
        D["border-radius: 4px"]
        E["font-size: 14px"]
    end
    
    subgraph "Figma Properties"
        F["layoutMode: HORIZONTAL"]
        G["fills: [{type: SOLID, color: {r,g,b}}]"]
        H["paddingTop/Right/Bottom/Left"]
        I["cornerRadius: 4"]
        J["fontSize: 14"]
    end
    
    A --> F
    B --> G
    C --> H
    D --> I
    E --> J
    
    style A fill:#fff3e0
    style B fill:#fff3e0
    style C fill:#fff3e0
    style D fill:#fff3e0
    style E fill:#fff3e0
    style F fill:#e8f5e9
    style G fill:#e8f5e9
    style H fill:#e8f5e9
    style I fill:#e8f5e9
    style J fill:#e8f5e9
```

## Component Structure

```mermaid
graph TB
    A[DesignSystem] -->|contains| B[Components Array]
    B --> C[Component 1]
    B --> D[Component 2]
    B --> E[Component N]
    
    C --> F[Properties:<br/>• id<br/>• name<br/>• aliases<br/>• category<br/>• html<br/>• previewUrl]
    
    C --> G[Props Array]
    G --> H[ComponentProp:<br/>• name<br/>• type<br/>• values]
    
    C --> I[Variants Array]
    I --> J[ComponentVariant:<br/>• name<br/>• props<br/>• html override]
    
    style A fill:#bbdefb
    style B fill:#c5cae9
    style C fill:#d1c4e9
    style F fill:#f3e5f5
    style G fill:#e1bee7
    style H fill:#f3e5f5
    style I fill:#e1bee7
    style J fill:#f3e5f5
```

## Key Technologies

```mermaid
mindmap
  root((Plugin))
    Frontend
      React 18
      TypeScript 5.x
      Fuse.js 7.x
        Fuzzy Search
        Weighted Keys
        Threshold 0.4
    Build
      Vite 5.x
      vite-plugin-singlefile
        Single HTML file
        189KB total
    Backend
      Figma Plugin API
        createFrame
        createText
        Auto Layout
      HTML Converter
        DOMParser
        Style Parser
        Node Mapper
    Data
      JSON Catalog
        3 Design Systems
        15 Components
        Pre-inlined HTML
```
