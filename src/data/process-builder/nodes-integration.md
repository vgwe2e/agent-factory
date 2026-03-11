# Aera Process Builder - Nodes & Integration Reference

## Overview

This document covers detailed Process Builder node documentation and integration features extracted from the official Aera Technology documentation (p6 series). It provides comprehensive reference material for individual node types, context menu operations, Java methods for scripting, and process scheduling capabilities.

**Prerequisites**: Familiarity with Process Builder fundamentals and advanced topics. See `process-builder-fundamentals.md` and `process-builder-advanced.md` for foundation concepts.

**Covered Topics**:
- Transaction and execution control nodes
- Workflow orchestration nodes
- Integration and communication nodes
- UI and data science nodes
- Node context menu operations
- Condition types and scripting
- Java methods reference
- Process scheduling

---

## Transaction & Execution Control Nodes

### Transaction Node

**Purpose**: Groups multiple operations into a single atomic transaction with rollback capability.

**Use Case**: Ensures data consistency by treating multiple database operations as a single unit of work.

**Permissions**: Data Engineer, Data Scientist, Skill Developer, Administrator

**Configuration**:
- **Status**: Select value from dropdown
- **Timeout**: Enter timeout value in seconds

**Key Features**:
- Groups multiple nodes into single transaction
- Works with Rollback Transaction node
- Supports Success, Enabled, and Keep History flags

**Important Constraints**:
- Cannot be parent of: UI Screen, Asynchronous, Subprocess, Dynamic Subprocess nodes

### Rollback Transaction Node

**Purpose**: Explicitly rolls back a transaction when conditions are met.

**Use Case**: Revert all changes in a transaction when errors occur or business rules fail.

**Key Requirements**:
- Must always be preceded by Transaction Node
- Reverts entire transaction before proceeding to next branch

### Wait Node

**Purpose**: Temporarily halts process execution for parallel branch coordination.

**Use Case**: Synchronize multiple asynchronous branches before proceeding.

**Behavior**:
- **Resolves to True**: Triggers parallel execution
- **Resolves to False**: Pauses until all Asynchronous nodes complete

**Configuration**: Supports all condition types (Compare values, Custom Script, Call functions, etc.)

### Asynchronous Node

**Purpose**: Enables parallel execution of process branches.

**Use Case**: Run multiple operations concurrently for improved performance.

**Key Features**:
- Used in conjunction with Wait Nodes
- Placed after Wait Node
- Each node represents a specific parallel branch
- Supports Success, Enabled, and Keep History flags

**Best Practice**: See "Improve Processing Time with Asynchronous nodes" in advanced documentation.

### Branch Node

**Purpose**: Organizes nodes into logical segments for better process structure.

**Use Case**: Break down complex processes into manageable sections for easier debugging.

**Key Features**:
- Create multiple branches within a Process
- Often used as IF node alternative
- No limit on number of branches
- Improves visual organization of lengthy processes

---

## Workflow & Logic Nodes

### Rules Node

**Purpose**: Execute business rules within a process flow.

**Use Case**: Apply business logic and validation rules to process data.

**Configuration**:
- **Event**: Select existing rule from Current Workspace or Public
- **Rule Parameters**: Map input and output variables
- **Data Source**: Choose Variable or Interface

**Data Source Options**:
1. **Variable**: Select from dropdown or use as constant
2. **Interface**: Map Interface into process via variables (supports Current Workspace or Public)

**Management Actions**:
- Edit: Modify rule configuration
- Delete: Remove rule from process
- Reorder: Drag and drop to change execution order

### Stream Node

**Purpose**: Input static SQL within process steps for streaming data management.

**Use Case**: Process data streams without dynamic changes from calling process.

**Configuration**:
- **Stream Type**: Fixed or Variable
- **Value**: Select stream (Fixed) or variable (Variable)
- **Continue On Error**: Toggle to handle errors in Readable/Writable streams
- **Open Stream**: Access selected stream page (disabled for Variable type)

**Key Characteristics**:
- Provides abstract interface for streaming data
- Values are static and cannot be dynamically changed
- Can read/write stream data in chunks
- End event triggers after all data consumed

---

## Communication & Notification Nodes

### Notification Node

**Purpose**: Send email notifications from within a process.

**Use Case**: Send alerts or notifications about important events, updates, or required actions.

**Configuration**:
- **Title**: Notification title
- **To**: Email IDs (supports fixed values or variables using `{{VariableName}}` syntax)
- **Subject**: Email subject (fixed or variable)
- **Body**: Rich text email content with formatting, links, and images

**Features**:
- HTML email formatting (font style, color, size, alignment)
- Bulleted lists and indents
- Link and image insertion
- Full-screen editing mode
- Variable interpolation (arrays not supported)

**Important**: Variable names must be enclosed in double braces: `{{VariableName}}`

---

## Process Orchestration Nodes

### Subprocess Node

**Purpose**: Execute another process within a larger process.

**Use Case**: Reuse existing processes and promote modularity.

**Configuration**:
- **Process**: Select from Current Workspace or Public
- **Input Parameters**: Map variables to pass to subprocess
- **Output Parameters**: Map variables to receive from subprocess

**Variable Mapping**:
- **Show All**: Display all variables in process
- **Show Mapped**: Display only mapped variables
- **Pass data from**: Select source variable
- **Subprocess variables**: Target variable in subprocess

**Important Notes**:
- Subprocess opens in new tab (highlighted in yellow)
- Can debug subprocesses (up to 2 levels deep)
- Public process confirmation required when debugging

### Dynamic Subprocess Node

**Purpose**: Dynamically select which process to execute using variables.

**Use Case**: Runtime process selection based on business logic or data conditions.

**Configuration**:
- **Variable**: Select variable containing process ID
- Variable value determines which process executes
- Value brought through Interface

**Key Difference**: Unlike Subprocess node, process selection is dynamic at runtime.

### Action Item Node

**Purpose**: Manage Inbox recommendations in Decision Workbench.

**Use Case**: Populate, update, or retrieve recommendation data.

**Methods**:
- **Create**: Populate data in Inbox grid
- **Update**: Update Inbox when user takes action (accept/reject)
- **Get**: View details page for a recommendation

---

## Data & Analytics Nodes

### Data Science Node

**Purpose**: Integrate data science services into process flow.

**Use Case**: Apply machine learning and analytics within business processes.

**Available Services**:

1. **Auto Forecast**:
   - Predicts future trends from historical data
   - 30+ statistical forecasting algorithms
   - Supports daily, monthly, weekly forecasting

2. **Inference**:
   - Operationalizes deployed ML models
   - Creates data pipelines with predictive models
   - Supports decision-making workflows

3. **Safety Stock**:
   - Calculates additional inventory buffers
   - Mitigates stockout risk
   - Handles supply/demand uncertainties

4. **Root Cause Analysis**:
   - Uses ML and data mining techniques
   - Identifies features impacting target variables
   - Generic service for various use cases

**Configuration**:
- Service selection from dropdown
- Input/Output parameter mapping
- Callback process specification (for async operations)

---

## UI Integration Nodes

### UI Screen Node

**Purpose**: Link UI screens to process execution.

**Use Case**: Integrate user interface with process logic.

**Configuration Options**:

1. **Create New UI**:
   - Click + icon to create new UI screen
   - Opens UI Builder in new tab
   - Automatically links to process

2. **Select Existing UI**:
   - Choose from dropdown
   - Variables reflected in UI screen node
   - Can open for editing

**Important**: Cannot open UI object with unsaved process changes (must save first).

**Management**:
- Open to edit UI screen
- Modify variable mappings
- Update UI components

---

## Node Context Menu Operations

### Context Menu Overview

**Access**: Right-click on any node to display context menu.

**Available Operations** (varies by node type and position):

| Operation | Description | Availability |
|-----------|-------------|--------------|
| **Copy ID** | Copy node ID for search/reference | All nodes |
| **Copy URL** | Copy process URL with node reference | All nodes |
| **Change Node Order** | Rearrange nested nodes | Nodes with branches |
| **Copy** | Copy node for paste | All nodes |
| **Copy Branch** | Copy entire branch | Branch nodes |
| **Cut Branch** | Cut branch for move | Branch nodes |
| **Paste** | Paste copied node/branch | All nodes |
| **Delete Node Only** | Delete node (preserves children) | Conditional nodes |
| **Delete Branch** | Delete entire branch | Branch nodes |
| **Collapse/Expand** | Hide/show node branches | Nodes with children |
| **Open Process** | Open linked subprocess | Subprocess nodes |

### Deletion Constraints

**Branch Node**: Cannot delete if multiple branches exist (warning displayed)

**Conditional Nodes** (IF, While, etc.):
- Cannot delete if branches or dependencies exist
- Must delete dependent nodes first

**Transaction/Wait/Async Nodes**: Warning to check and update dependent nodes

**Interface Node**: Deleting removes data but variable remains in list (empty)

---

## Condition Types & Configuration

All condition-based nodes (IF, While, Do While, Wait, Script) support these condition types:

### 1. Compare Values

**Purpose**: Compare two values using operators.

**Configuration**:
- **Variable**: Select variable to compare
- **Comparison Operator**: equal to, not equal to, greater than, less than, etc.
- **Compare to**: Variable or Fixed value

**Operators** (vary by data type):
- Numeric: =, ≠, <, ≤, >, ≥
- String: equal to, not equal to, contains, starts with
- Boolean: is true, is false

**Validation**: Click Validate to verify condition syntax.

### 2. Custom Script

**Purpose**: Write custom Java code for complex logic.

**Configuration**:
- **Script Name**: Descriptive name for script
- **Script Content**: Java code (full Java SE 8 support)
- **Full Screen**: Expand editor for better visibility

**Features**:
- Access to all Java SE 8 features
- Process variable access
- UserType variable manipulation
- Logging capabilities
- Validation before save

### 3. Call List Functions

**Purpose**: Execute list manipulation functions on array variables.

**Configuration**:
- **Array**: Select array variable
- **Function**: Choose from available functions
  - Is at the start of list?
  - Is at the end of list?
  - Is list empty?
  - Remove current item
  - Select next list item
  - Select previous list item
  - Select first list item
  - Select last list item
  - Clear all the list items

**Use Case**: Iterate through arrays, validate list states, manipulate list content.

### 4. Call a Function

**Purpose**: Execute specific function within process.

**Configuration**:
- **Function**: Select from dropdown
- **Function Parameters**: Map input parameters
- **Return Variable**: Specify output variable

**Validation**: Always validate before saving to ensure correct configuration.

### 5. Call a Remote Function

**Purpose**: Invoke remote functions created in Notebook feature.

**Execution Modes**:

**Synchronous**:
- Waits for response
- Max 20 minutes execution
- Timeout error if exceeded
- Suitable for small datasets
- Low latency, low resource workloads
- Ideal for inference model predictions

**Asynchronous**:
- Runs concurrently without waiting
- Max 8 hours execution
- Suitable for extensive data processing
- Own executor (no resource sharing)
- High latency, high resource workloads
- Requires callback process (optional)

**Configuration**:
- **Function**: Select from Current Workspace or Public
- **Execution Mode**: Synchronous or Asynchronous
- **Callback Process**: For async mode (optional)
- **Function Parameters**: Map inputs/outputs

---

## Java Methods Reference

### Overview

Java methods enable custom scripting in Process Builder with full Java SE 8 support plus extended UserType methods.

**Available Packages**: `java.io.*`, `java.lang.*`, `java.util.*`, `java.util.stream.*`, `java.net.*`

**Important**: Cannot use Java reserved keywords as variable names.

### Method Categories

1. **Environment & System**: `getEnvironmentType()`, `isMeshV2Environment()`, `getCurrentProjectId()`
2. **Process Control**: `stopProcessesByRequestID()`, `stopProcessesByNavigatorID()`, `getRunningProcesses()`
3. **Search & Discovery**: `searchProcesses()`, `searchInterfaces()`
4. **Variable Manipulation**: `fillStringVariableArray()`, `fillUserTypeArray()`, `getListFromVariableArray()`
5. **Data Conversion**: `toRawValue()`, `getListFromVariableUserTypeArray()`
6. **Execution**: `execAndGetResult()`, `executeScript()`, `chmod()`
7. **Timing**: `sleep()`, `sleepSeconds()`
8. **Validation**: `isEmpty()`

### Key Method Examples

**Environment Detection**:
```java
String envType = com.ispring.util.ExternalDataUtils.getEnvironmentType();
boolean isMeshV2 = com.ispring.util.EnvironmentUtil.isMeshV2Environment();
boolean isLegacy = com.ispring.util.EnvironmentUtil.isLegacyEnvironment();
```

**Process Management**:
```java
Map<String, List<RunningProcessData>> processes =
    com.ispring.client.monitoring.MonitoringUtils.getRunningProcesses();

com.ispring.client.monitoring.MonitoringUtils.stopProcessesByNavigatorID(navId);
```

**Search Operations**:
```java
SkillSearchRequest request = SkillSearchRequest.builder()
    .searchTerm("s").page(0).size(5).build();
SkillSearchResult result =
    com.ispring.client.monitoring.SkillSearchUtils.searchProcesses(request);
```

**Variable Array Operations**:
```java
List<String> list = Arrays.asList("apple", "mango", "pear");
ExternalDataUtils.fillStringVariableArray(stringArray.getThis(), list);
```

**UserType Manipulation**:
```java
// Fill from CSV stream
ExternalDataUtils.fillUserTypeArrayFromCSVStream(
    varArray, csvInputStream, null, null);

// Get as list
List<Map<String, Object>> list =
    ExternalDataUtils.getListFromVariableUserTypeArray(usertypeVar);

// Convert to raw values
Map<String, Object> raw = ExternalDataUtils.toRawValue(userType);
```

**Command Execution**:
```java
Command command = new CommandBuilder()
    .withScriptName("myScript")
    .withNamedParam("db-user", "john")
    .withEncryptedNamedParam("db-pass", "encrypted_value")
    .build();
ExecutionResult result = ExecutionUtil.execAndGetResult(command);
```

**Timing & Synchronization**:
```java
com.ispring.client.runtime.util.ThreadUtil.sleepSeconds(2); // 2 seconds
com.ispring.client.runtime.util.ThreadUtil.sleep(2000); // 2000 milliseconds
```

### Reserved Java Keywords

**Cannot be used as variable names**:

abstract, assert, boolean, break, byte, case, catch, char, class, const, continue, default, do, double, else, enum, extends, false, final, finally, float, for, goto, if, implements, import, instanceof, int, interface, long, native, new, null, package, private, protected, public, return, short, static, strictfp, super, switch, synchronized, this, throw, throws, transient, true, try, void, volatile, while

---

## Process Scheduling

### Overview

**Purpose**: Schedule processes to run at specific times or intervals.

**Permissions**: Administrator

**Capabilities**:
- Schedule processes and execution plans
- Recurring schedules (Daily, Weekly, Monthly)
- Cron job scheduling
- One-time execution
- Service user support

### Creating a Schedule

**Basic Configuration**:
1. **Schedule Name**: Descriptive name (required)
2. **Not Scheduled Toggle**: Enable/disable schedule
   - Enabled: Runs at specified time
   - Disabled: Saved but not executed (manual run available)
3. **System Schedule**: Prevent non-admin edits (Aera Admin only)
4. **Run as Service User**: Run even if original user is deactivated

**Service User Configuration**:
- Select service user email
- Enter password
- Validate credentials
- Option to change user later

### Schedule Object Selection

**Process Selection**:
- Choose from dropdown (master processes only)
- View/modify process parameters (optional)

**Show Parameters Toggle**: Display and edit process input parameters

### Schedule Types

**1. Recurring**:
- Frequency: Daily, Weekly, Monthly
- Start date and time
- End date and time
- Execution between specified period

**2. Cron Job**:
- Cron expression for complex scheduling
- Start date and time
- End date and time
- Follows cron syntax rules

**3. Once**:
- Single execution
- Specific date and time
- No recurrence

### Schedule Management

**Available Actions**:
- Create new schedule
- Edit existing schedule
- Enable/disable schedule
- Delete schedule (non-system schedules)
- Manually run scheduled job

**Status Indicators**:
- Next scheduled run time
- Last execution time
- Occurrence frequency
- Schedule status (enabled/disabled)

---

## Quick Reference Tables

### Node Categories

| Category | Nodes | Primary Use |
|----------|-------|-------------|
| **Transaction Control** | Transaction, Rollback Transaction | Data consistency |
| **Execution Control** | Wait, Asynchronous | Parallel processing |
| **Workflow** | Branch, Rules, Stream | Process organization |
| **Process Orchestration** | Subprocess, Dynamic Subprocess | Modularity, reuse |
| **Communication** | Notification | Alerts, notifications |
| **Data Management** | Action Item, Data Science | Analytics, recommendations |
| **UI Integration** | UI Screen | User interface |

### Context Menu Operations

| Operation | Shortcut | Applies To |
|-----------|----------|------------|
| Copy ID | - | All nodes |
| Copy/Paste | Ctrl+C/V | All nodes |
| Delete | Del | All nodes (with constraints) |
| Collapse/Expand | - | Nodes with children |
| Copy Branch | - | Branch nodes |
| Delete Branch | - | Branch nodes |

### Condition Types

| Type | Use Case | Complexity |
|------|----------|------------|
| Compare Values | Simple comparisons | Low |
| Call List Functions | Array operations | Low |
| Call a Function | Reusable logic | Medium |
| Call Remote Function | External services | Medium-High |
| Custom Script | Complex logic | High |

### Java Method Packages

| Package | Purpose | Key Methods |
|---------|---------|-------------|
| `com.ispring.util.ExternalDataUtils` | Variable manipulation | fill*, getListFrom* |
| `com.ispring.util.EnvironmentUtil` | Environment detection | getEnvironmentType, isMeshV2 |
| `com.ispring.client.monitoring.*` | Process monitoring | stopProcesses, getRunningProcesses |
| `com.ispring.client.runtime.util.*` | Execution utilities | exec, sleep |
| `com.ispring.client.file.util.*` | File operations | getClientDownloadFilePath |

---

## Best Practices

### Transaction Management
- Always pair Transaction with Rollback Transaction nodes
- Keep transaction scope as small as possible
- Consider timeout values based on operation complexity
- Test rollback scenarios thoroughly

### Parallel Processing
- Use Wait + Asynchronous pattern for performance gains
- Ensure variable mapping is exact for UserType variables
- Monitor resource usage with parallel execution
- Consider using subprocesses for complex parallel operations

### Script Node Usage
- Validate all custom scripts before saving
- Use logging for debugging: `logDebug()`, `logInfo()`, `logError()`, `logWarn()`
- Follow Java naming conventions for variables
- Avoid reserved keywords
- Comment complex logic thoroughly

### Scheduling Best Practices
- Use service users for production schedules
- Set appropriate timeout values
- Monitor scheduled job execution history
- Use system schedules for critical jobs
- Test schedules before production deployment

### Node Organization
- Use Branch nodes to organize complex processes
- Collapse branches to improve visual clarity
- Use descriptive node names
- Group related operations logically
- Document complex decision logic in descriptions

---

## Related Documentation

- **Fundamentals**: See `process-builder-fundamentals.md` for basics
- **Advanced Topics**: See `process-builder-advanced.md` for complex patterns
- **Documentation Index**: See `process-builder-index.md` for navigation

---

## Summary

This documentation covers:

✅ **18+ Node Types**: Transaction, Wait, Async, Branch, Rules, Stream, Notification, Subprocess, Dynamic Subprocess, Action Item, Data Science, UI Screen

✅ **Context Menu Operations**: Copy, paste, delete, collapse, expand, branch management

✅ **5 Condition Types**: Compare values, Custom Script, Call list functions, Call function, Call remote function

✅ **40+ Java Methods**: Environment detection, process control, variable manipulation, execution utilities

✅ **Process Scheduling**: Recurring, Cron, One-time execution with service user support

**Key Capabilities**:
- Comprehensive node reference for all process building scenarios
- Rich scripting environment with Java SE 8 support
- Flexible scheduling for automated execution
- Context-aware operations for efficient process development
- Integration capabilities for UI, data science, and external services
