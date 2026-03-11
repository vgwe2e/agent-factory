# Aera Process Builder - Fundamentals

## Overview

### What is Process Builder?

Process Builder is a flexible development kit that uses Aera's patent, visually-driven interface to create and manage a framework. It integrates and coordinates all of Aera's services and data in a single platform necessary for implementing a process.

**Purpose**:
- Helps skill developers build processes in the Aera Decision Cloud
- Enables defining diverse processes related to data integration, calculation and analytics, modeling and optimization, and user interaction
- Combines a bi-directional connection to real-time data layer with tools to apply both descriptive logic and algorithms to data

**Key Capabilities**:
- Uses drag-and-drop creation
- Object and process reusability
- Easy extensibility
- Execute integrated AI and machine learning
- Publish reusable processes
- Execute writeback transactions
- Incorporate custom scripting

## Core Concepts

### Algorithmic Workflow

**Definition**: Uses pre-defined nodes library and variables to perform various functions and aid in building an application, process, or skill in Aera Decision Cloud.

**How it Works**: Nodes are organized in a hierarchical flowchart as a paradigm for building skills in a workspace.

**Key Components**:
- Pre-defined nodes library
- Variables to perform functions
- Hierarchical flowchart structure

### Integrated Development Environment (IDE)

**Definition**: Facilitates lifecycle development management.

**Features Include**:
- Branching and merging
- Debugging tools
- Version management
- Process logs

### Branching Model

**Purpose**: Create and organize processes, allowing testing independently before merging into master branch.

**Branch Types**:

1. **Child Branch**
   - Supports development, modification, and testing of processes
   - Must be merged into the master branch
   - Can be created, edited, and deleted
   - Changes made here don't affect master until merged

2. **Master Branch**
   - Permanent branch representing production-ready state
   - Displays only processes that have been merged
   - Read-only (cannot edit directly)
   - Consistently represents production-ready state

**Important**: Branching and merging apply only to Processes and UI Builder objects.

### Process Node

**Definition**: The default starting point of every process, representing the process itself.

**Characteristics**:
- Appears by default when creating a new process
- Named after the process you created
- Can be renamed by double-clicking on it
- Acts as the entry point for process execution

### Variables System

**Purpose**: Input and output variables (parameters) that link nodes together and make processes logical and meaningful.

**Variable Types**:

1. **Process Variables**
   - Created and defined at the process level
   - Scope: Within the specific process
   - Can be created at any time during process development

2. **Global Variables**
   - Defined at Workspace skill level
   - Created in Configurations > Global Variables section
   - Accessible across multiple processes
   - Can be selected in Process node property panel

3. **Session Variables**
   - Session-specific, system-generated variables
   - Auto-initialized variables include:
     - Current_User_ID
     - Project_ID
     - User_Login_Email
     - User_Name
   - Accessible from Session Variable tab in Process node

### Nodes Library

**Definition**: Collection of pre-defined nodes that represent specific actions or criteria determining process flow.

**Node Execution**: Nodes execute in the order they are placed - left to right, then top to bottom.

**Available Nodes**:
- Interface node
- Report node
- Data View node
- If node
- While node
- DoWhile node
- Script node
- Transaction node
- Rollback Transaction node
- Wait node
- Asynchronous node
- Branch node
- Rule node
- Notification node
- Subprocess node
- Dynamic Subprocess node
- Stream node
- Action Item node
- Data Science node
- UI Screen nodes
- Agent Team node

## Getting Started

### Prerequisites

**Required Permissions**: Assigned by administrator to users with these roles:
- Data Engineer
- Data Scientist
- Skill Developer
- Administrator

### Setting Up a Branch

**Steps to Create a New Child Branch**:

1. Navigate to Aera Home page > Workspaces
2. Select your created Workspace
3. Under Workspace home, navigate to branch box in bottom left corner
4. Click "Create new branch"
5. Enter branch name in the New branch dialog
6. Click "Create"
7. You will be directed to the newly created branch

**Deleting a Branch**:
- Hover over branch name
- Click delete icon
- Confirm deletion in dialog

### Creating a New Process

**Method 1: From Processes Section**

1. Navigate to Aera Workspace
2. In Content tab, expand Automation and click Processes
3. Click "New Folder" to create folder (optional for organization)
4. Click "New Object" to create new Process
   - OR click "Click here" link below object description

**Method 2: Direct Creation**

1. Open Processes section
2. Click "New Object"
3. Enter process details in New Process dialog

**New Process Dialog Fields**:
- **Process Name**: Enter name (letters, numbers, underscores, dashes, spaces, parentheses only - no special characters)
- **Target Folder**: Select folder location

**Result**: Process Builder page displays with default Process node named after your process.

### Understanding the Process Builder Interface

**Three Main Areas**:

1. **Toolbar Menu** (Top)
   - Contains key features for configuring and validating processes
   - Tools: Run, Debugger, Profiler, Create Variable, Settings

2. **Sidebar Navigation** (Left)
   - General information and dependencies
   - Object Information
   - Dependencies viewer

3. **Bottom Bar** (Bottom)
   - Shows current branch
   - View, change, or create branches
   - Pull and Merge features

## Interface Reference

### Toolbar Menu

| Tool | Description | Key Features |
|------|-------------|--------------|
| **Search** | Locate specific nodes | Enter name or node ID |
| **Compile** | Check for errors and glyph references | Validates process structure |
| **Run** | Execute the process | Runs and tests process |
| **Debugger** | Inspect code state and trace execution | Set breakpoints, step through code |
| **Profiler** | Identify nodes consuming more time | Performance analysis |
| **Nodes Toolbox** | Choose and add nodes | Drag-and-drop interface |
| **Create Variable** | Create new process variables | Define variable properties |
| **Zoom** | Adjust page size | Magnify or reduce view |
| **Duplicate** | Create copy of process | Duplicates with new name |
| **Show Logs** | View recent activity history | All process changes |
| **Settings** | Configure process settings | Available in Rules, Singleton |
| **Undo/Redo** | Reverse or restore actions | Up to 5 steps |
| **Save** | Save the process | Persist changes |

### Sidebar Navigation

**Object Information Tab**:
- Name: Process name (editable)
- Description: Process description (editable)
- Object Type: Shows object type
- Object ID: Unique identifier (copyable)
- Created: Date, timestamp, and creator
- Updated: Last update date, timestamp, and user

**Dependencies Tab**:
- **Used by**: Objects that use this process (Interfaces, Rules, Processes, UI Screens)
- **Uses**: Objects that are used in your process

**Builder**: Navigate back to Process Builder page

### Bottom Bar

**Pull Feature**:
- Brings latest changes from master branch into your branch
- Use when master has updates not in your branch
- Highlights mergeable and conflicting objects
- Shows who last updated objects
- Options: Merge, Keep your version, Keep master version

**Merge Feature**:
- Merges changes to Master branch
- Finalizes changes for sharing with other users
- Required for deployment to another environment
- Option to delete branch after merge

**Branch Indicator**:
- Shows current working branch
- Orange circle indicates master has updates to pull
- Tooltip: "Master branch has been updated"

## Key Features

### Debugger

**Purpose**: Essential for managing complex code and tracking down bugs.

**Key Features**:

1. **Breakpoints**
   - Set at specific lines/nodes
   - Pauses execution at those points
   - Inspect process state at breakpoint
   - Visualized with blue dots on nodes

2. **Stepping Through Code**
   - Execute process one line at a time
   - Observe node behavior step by step
   - Understand execution flow

3. **Variable Inspection**
   - Inspect variable values at breakpoints
   - Track data changes over time
   - Identify incorrect values

4. **Expression Evaluation**
   - Evaluate expressions within debugger
   - Run code snippets
   - Test specific parts of process

**Using the Debugger**:

1. Open Process and click Debugger on toolbar
2. Debugger panel displays at bottom
3. Click play icon to start debugging
4. Debugging icon appears on Process tab
5. Session ends with confirmation message

**Debugging Results Tabs**:
- **Process Variables**: All variables used in process
- **Watching Variables**: Variables marked for monitoring (can update values)
- **Runtime Logs**: Runtime logs with error identification
- **Results**: Output rendered on browser

**Adding Breakpoints**:

1. Click Debugger icon
2. Click Manage Breakpoints icon
3. Select checkboxes for nodes to add as breakpoints
4. Blue dots appear on selected nodes

**Important**: If child node is breakpoint, parent node also displays in Breakpoint list.

**Removing Breakpoints**:
- Click breakpoint icon on nodes
- Click clear all icon on Debugger page
- Unselect in Manage breakpoints dialog

**Note**: Removing breakpoint on subprocess disables nested node breakpoints.

**Debugging Subprocesses**: Can debug subprocesses created in another workspace. Two levels of subprocesses continue to debug in session.

### Profiler

**Purpose**: Measures performance and resource usage, offering visibility at each node to optimize the overall process.

**Key Features**:

1. Identify nodes consuming excessive time
2. Analyze duration spent on each run at each node
3. Review node details and configuration
4. Implement fixes and assess time improvements
5. Compare current branch vs. Master branch execution time

**Using Profiler**:

1. Create or open existing Process
2. Click Profiler on toolbar
3. Run History page displays

**Run History Filters**:
- **Last Runs**: Today, Last 7 days, Last 10 days, Last 30 days
- **Show master**: View Master branch results
- **Show current branch**: View current branch results
- **Sort By**: Date or Duration

**Note**: When in Master Branch, "Show master" and "Show current branch" are disabled.

**Run Details**:
- Click on run history result to view details
- Shows date, time, and branch at top
- Node details sorted by order and total duration

**Node Type Filter**: Display runtime of specified node

**Sort By Options**:
- **Running Order**: The way process runs
- **Duration and Name**: Arrange in ascending/descending order

**Copy Node ID**: Hover on listed node to copy node ID (helps search in larger processes)

### Show Logs

**Purpose**: Displays recent history of supported errors on a process. Convenient single-click toggle for viewing run-time logs.

**Benefits**:
- Captures all supported logs including errors
- Beneficial for large processes with extensive code repositories
- Facilitates bug identification and appropriate action

**Features**:
- **Pause Logs**: Halt showing new logs to check errors
- **Minimize all Logs**: Display whole code with error, quick grasp of main headings and error count

**Log Types**:

1. **INFO (Informational Logs)**
   - General information about application status and activities
   - Includes startup messages, configuration settings, progress updates

2. **ERROR (Error Logs)**
   - Indicates something has gone wrong
   - Includes error cause, severity, and stack trace

3. **WARN (Warning Logs)**
   - Noteworthy situations that aren't errors
   - Signal potential issues or unexpected behavior

4. **DEBUG (Debug Logs)**
   - Detailed information for developers
   - Includes variable values, function calls, internal details

### Undo-Redo

**Purpose**: Reverse most recent action or restore undone change within a Process.

**Applicable To**:
- Adding nodes
- Deleting nodes
- Renaming nodes

**Using Undo/Redo**:

1. Click Undo icon to reverse changes
2. Redo icon becomes available after undoing
3. Click Redo icon to restore undone actions

**Limitations**:
- **Changes reversed up to 5 steps**
- Cannot undo/redo after:
  - Logging out from Aera platform
  - Saving a Process
  - Exiting Aera Developer (closing browser)

### Pull/Merge

**Pull**:
- Fetches latest changes from Master branch
- Use when Master has updates not in your branch
- Highlights mergeable and conflicting objects
- Shows last updater and timestamp

**Pull Options**:
- **Merge**: Combine changes (for mergeable objects)
- **Keep my version**: Override master with your changes
- **Keep Master version**: Retain master changes

**Merge**:
- Integrates changes into Master branch
- Required for finalization and deployment
- Shows object details: name, type, update date, change type, info
- Option to delete branch after successful merge

## Procedures

### Creating a Process Variable

**Method 1: Using Process Node**

1. Create or open a Process (Process Node appears by default)
2. Click Process node to open Properties panel
3. Process Variables tab selected by default
4. Click "+Create new variable"
5. Enter details:
   - **Name**: Variable name
   - **Type**: Select from dropdown (Boolean, Date, Double, Float, Integer, Long, Object, String, Time, TimeStamp, UserType)
   - **Value**: Actual data (e.g., False or 0)
   - **Array**: Check if multiple values
   - **Public**: Check if other users can use in external processes
6. Click Save

**Variable Type Definitions**:

- **Boolean**: True or False values for conditional logic
- **Date**: Date information in MM/DD/YY format
- **Double**: Pricing, percentages with decimal precision
- **Float**: Like Double with narrower range
- **Integer**: Whole numbers without decimals
- **Long**: Like Integer with wider range
- **Object**: Contains Java objects
- **String**: Sequence of characters (text) in quotes
- **Time**: Time in hour:minute:second format
- **TimeStamp**: MM/DD/YY and hour:minute:second
- **UserType**: Multiple variables with multiple types, root for variable groups

**Additional Actions**:
- **Delete**: Click delete icon (warns if variable is used)
- **Duplicate**: Click duplicate icon (creates Copy_of_[name])
- **Info**: Click info icon to view usage and dependencies

**Method 2: Using Toolbar**

1. Create or open Process
2. Click "Create Variable" on toolbar
3. Create new variable dialog appears
4. Enter:
   - Variable name
   - Variable type
   - Value (optional)
   - Public checkbox (optional)
   - Array checkbox (optional)
5. Click Create
6. Variable appears under Process Variable
7. Click Save

### Creating Global Variables

1. Click Configurations tab
2. Global Variables section appears
3. Click "+ Create new variable" OR click + icon at top right
4. New row appears
5. Enter details:
   - **Name**: Variable name
   - **Type**: Boolean, String, Integer, Date, Double, Long, Object, Time, Timestamp, Connection
   - **Value**: Depends on selected type
   - **Description**: Variable description
6. Variable created

**Variable Type Definitions**:
- **Boolean**: True or False values
- **String**: Characters/text
- **Integer**: Whole numbers
- **Date**: Calendar date without time
- **Double**: Decimal numbers with double precision
- **Long**: Large integers
- **Object**: Any object reference
- **Time**: Time of day without date
- **Timestamp**: Date and time combined
- **Connection**: Database or network resource connection

**Managing Global Variables**:
- **Duplicate**: Click duplicate icon (creates Copy_of_[name])
- **Delete**: Click delete icon (warns about affected objects)

### Selecting Global Variables for Process

1. Create or open Process (Process Node appears)
2. Click Process node for Properties panel
3. Click "Global Variable" tab
4. Created Global Variables display
5. Select required Global Variable by checking checkbox

### Selecting Session Variables

1. Perform steps 1-2 from Selecting Global Variables
2. Click "Session Variable" tab
3. Session variables display
4. Select by checking Use column checkboxes

### Using Interface Node in Process

1. Create a Process
2. Drag and drop Interface node to Process
3. Close Nodes panel
4. Click Interface node for Properties panel
5. Click "Add Interface"
6. Add Interface panel appears
7. Select Interface from dropdown (Current Workspace or Public)
8. Interface added with Input and Output parameters
9. Enter Values for parameters from dropdown
10. Options:
    - Select existing value
    - Click "Clear selected"
    - Click "Create new variable"
    - Enter value, click "Use as constant"
11. Click Save
12. Click Run

**Creating New Interface**:
1. Click "Create new Interface"
2. Enter:
   - Interface name
   - Interface type
   - Folder
3. Click Create
4. Interface module opens in new tab

**Managing Interface Node**:
- **Edit**: Click edit icon
- **Delete**: Click delete icon
- **Reorder**: Drag and drop
- **On Error**: Select Abort or Continue (default: Abort)

### Using Agent Team Node in Process

1. Create a Process
2. Drag and drop Agent Team node
3. Close Nodes panel
4. Click node name to rename (e.g., "Summon Orders Team")
5. Click Agent Team node for Properties panel
6. Select object type:
   - **Agent**: Single Agent execution (default)
   - **Agent Team**: Multiple Agents for complex tasks
7. Select Agent or Agent Team from dropdown
8. Select version, Input Parameter, Output Parameter display
9. Choose Execution Mode:
   - **Synchronous**: Wait for completion
   - **Asynchronous**: Run with callback
10. Enter required information based on mode
11. Enter values for parameters
12. For Asynchronous: Select Callback Process
13. Click Save
14. Click Run

## Technical Constraints

### Naming Conventions

**Process Names**:
- Can include: letters, numbers, underscores (_), dashes (-), spaces, parentheses ()
- **Cannot include**: Special characters or symbols
- Cannot be empty

**Node Names**:
- Cannot be empty
- Can be renamed by double-clicking

**Variable Names**:
- Follow same rules as process names
- Must be unique within scope

### Operational Constraints

**Interface Return Limit**: Maximum 25,000 results

**Undo/Redo Limit**: Up to 5 steps

**Process Execution**:
- Nodes execute left to right, then top to bottom
- Sequence matters for process flow

**Branching**:
- Applies only to Processes and UI Builder objects
- Child branches must merge to Master
- Master branch is read-only

**Debugging**:
- Process must be saved before debugging
- Unsaved process prompts save dialog
- Subprocesses can be debugged up to 2 levels deep

### Interface-Specific Constraints

**Interface Properties**:

**Type Options**:
- Query: SQL query execution
- Function: SQL function execution
- Multistatement: Multiple queries
- Script: File path to script

**Advanced Properties** (all numeric, 100 char limit):
- Fetch Buffer Size: Result set buffer size
- Cache Size: Records cached locally in memory
- Time To Live: Auto-expire database records
- Query Timeout: Timeout in seconds
- Cache: On/Off for caching output

**Connection Type Options**:
- Query
- Pool
- Script

**Batch Mode**: Only for inserts and updates

**Continue on Error**: Enables execution even if one statement fails (multistatement queries)

### Session and State Management

**Session Variables** (Auto-initialized):
- Current_User_ID
- Project_ID
- User_Login_Email
- User_Name

**Process State**:
- Unsaved state indicated by "Not Saved" in toolbar
- Saved state shows "Saved" in toolbar
- Success message: "Process successfully saved"

**Pull/Merge State**:
- Orange circle on Pull: Master has updates
- Tooltip: "Master branch has been updated"
- Can merge: "Yes" allows merge action
- Cannot merge: "No" requires version choice

### Variable Constraints

**Variable Watching**:
- Star (*) icon marks variable as watching
- Can update watching variable values during debugging
- Value updates in Value field during debug session

**Variable Deletion**:
- Cannot delete if used in nodes (shows warning with dependencies)
- Deleting subvariable when parent is used shows confirmation dialog

**Variable Value Metadata**:
- Set to "UserType" for all types except UserType
- For UserType: Select Metadata and click Apply

### Profiler Constraints

**Node Type Sorting**:
- Running Order: Execution sequence
- Duration and Name: Ascending/descending sort
- Can hover to copy node ID

**Result Limitations**:
- Preview shows restricted results
- Out of millions, shows only few hundred
- Execute disabled for Insert and Update queries

## Additional Resources

### Next Topics

After understanding these fundamentals, proceed to:
- **Understanding Process Builder Nodes**: Detailed node library and usage
- **Understanding Variables**: Comprehensive variable system
- **Understanding Context Menu of Nodes**: Node context operations
- **Creating New Interface**: Interface creation and management

### Roles and Permissions

Process Builder accessible to:
- Data Engineer
- Data Scientist
- Skill Developer
- Administrator

### Related Documentation

- Building a Workspace
- UI Builder objects
- Creating Global Variables
- Subprocesses
