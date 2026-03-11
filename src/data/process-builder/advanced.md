# Aera Process Builder - Advanced Topics

## Overview

This document covers advanced Process Builder topics from the official Aera Technology documentation (p5 series). It includes detailed node library references, advanced scripting techniques, variable manipulation, and best practices for building complex processes.

**Prerequisites**: Familiarity with Process Builder fundamentals. See `process-builder-fundamentals.md` for basics.

**Covered Topics**:
- Advanced nodes (Report Data, Data View, IF, While, Do While, Script)
- Java scripting techniques
- UserType variable manipulation
- Best practices and naming conventions
- Performance optimization strategies

---

## Advanced Nodes Library

### Report Data Node

**Purpose**: Extracts data from a preconfigured report and maps it to process variables.

**Use Case**: When you need to extract specific data from a report for use in a process.

**Permissions**: Data Engineer, Data Scientist, Skill Developer, Administrator

#### Using Report Data Node

**Configuration Steps**:

1. **Add Node**: Drag and drop Report Data node to Process
2. **Access Properties**: Click the node to open Properties panel
3. **Add Report**: Click "Add Report" button
4. **Select Report**: Choose from Application → Content Areas → Reports → Sheets (sequential selection)
5. **Configure Sheet Details**:
   - **Report variable**: Select or create variable to store results
   - **Generate variable**: Auto-create variable from report structure
   - **Clear cache**: Enable to clear cached files (disabled by default)
   - **All columns**: Select/deselect columns to include (all selected by default)
   - **Selected columns**: View chosen columns
   - **Add Filter**: Apply filters to report data

#### Adding Filters in Report Node

**Filter Configuration**:
- Select column to filter
- Choose operator: `equal`, `not equal`, `less than`, `less or equal`, `greater than`, `greater or equal`
- Specify value: Select variable, use constant, or create new variable

**Filter Options**:
- **Use as constant**: Enter static value for filter
- **Create new variable**: Define new variable for filter value
- **Select variable**: Choose existing variable

#### Managing Report Data Node

**Available Actions**:
- **Edit**: Click edit icon to modify report configuration
- **Delete**: Click delete icon to remove report
- **Reorder**: Drag and drop to change report execution order
- **Description**: Add descriptive text for documentation

---

### Data View Node

**Purpose**: Provides direct access to data within Process Builder without SQL queries. Minimizes need for Reports or Interfaces nodes.

**Key Features**:
- Direct access to Measures and Dimensions
- Multiple data sources in single node
- Maps data using UserType variables
- Two creation methods: from existing Data View or from Subject Area

**Permissions**: Data Engineer, Data Scientist, Skill Developer, Administrator

#### Using Data View Node

**Basic Steps**:

1. Drag and drop Data View node to Process
2. Click node to access Properties panel
3. Click "+Add Data View(s)"
4. Select creation method:
   - **Data View**: Use existing Data View
   - **Subject Area**: Create new from Subject Areas
5. Configure selections and variables
6. Save and run

#### Creating from Existing Data View

**Procedure**:

1. **Select Data View**: Browse, search, or use Recents/Favorites
2. **Click "Select Data View"**: Opens copy of selected Data View
3. **Select Columns**: Choose Dimensions and Measures checkboxes
4. **Refresh Data**: Click refresh icon to load selected columns
5. **Custom Fields** (Optional): Click "+Custom" for custom Dimensions/Measures
6. **Assign Variable**:
   - Select from dropdown
   - Create new variable
   - Generate variable (auto-creates based on schema)
7. **Add Filters** (Optional): Click filter icon
8. **Add**: Finalizes Data View addition

**Variable Generation**:
- Enter variable name in Generate variable dialog
- Click "Add" to create variable with matching schema

#### Creating from Subject Area

**Procedure**:

1. **Click "Subject Area"**: Opens Subject Area Selection
2. **Expand Folders**: Navigate folder structure or search
3. **Select Subject Area**: Choose required Subject Area
4. **Click "Select Subject Area"**: Opens Edit Data View page
5. **Select Columns**: Choose Dimensions and Measures
6. **Refresh Data**: Load data in selected columns
7. **Custom Fields** (Optional): Add custom Dimensions/Measures
8. **Assign Variable**: Select, create, or generate variable
9. **Add Filters** (Optional): Apply filter conditions
10. **Click "Done"**: Completes Data View creation

#### Adding Filters in Data View Node

**Filter Steps**:

1. Click filter icon (opens Filters panel)
2. Click "+" icon to add filter
3. Select column from list
4. Click "Add"
5. Configure filter in Add Filter dialog:
   - Select operator (equal, not equal, contains, starts with, etc.)
   - Select value from available options OR
   - Enter value and select from dropdown OR
   - Create new variable
6. Click "Add Filter" to apply

**Filter Management**:
- **Edit**: Click kebab menu → Edit
- **Clear**: Click kebab menu → Clear
- Multiple filters can be applied with AND/OR logic

#### Managing Data View Node

**Management Actions**:
- **Edit**: Click edit icon to modify Data View
- **Delete**: Click delete icon to remove Data View
- **Description**: Add descriptive text for documentation

---

## Control Flow Nodes

### IF Node

**Purpose**: Conditional node that defines actions/decisions based on whether conditions are true or false.

**Use Case**: Control process flow according to specific conditions.

**Permissions**: Data Engineer, Data Scientist, Skill Developer, Administrator

#### Using IF Node

**Configuration Steps**:

1. Drag and drop IF node to Process
2. Click node to access Properties panel
3. Click "New Condition"
4. Choose condition type:
   - **Compare values**: Compare two values with operators
   - **Custom Script**: Write Java script for complex logic
   - **Call a list functions**: Execute list manipulation functions
   - **Call a function**: Execute specific function
   - **Call a remote function**: Execute remote function
5. Save and run process

#### Managing IF Node

**Management Options**:
- **Delete condition**: Click delete icon
- **Add description**: Click Description tab and enter text
- **Reorder conditions**: Drag and drop conditions

**Condition Execution**:
- Conditions evaluated in order
- First true condition executes its branch
- Supports AND/OR logical operators between conditions

---

### While Node

**Purpose**: Creates loop that repeatedly executes actions while condition is true. Terminates when condition becomes false.

**Use Case**: Repeatedly execute actions until certain condition is met. Commonly used with UI Screen nodes for continuous UI functionality.

**Key Characteristics**:
- Checks condition BEFORE executing loop body
- Loop may never execute if condition initially false
- Continues while condition remains true

**Permissions**: Data Engineer, Data Scientist, Skill Developer, Administrator

#### Using While Node

**Configuration Steps**:

1. Drag and drop While node to Process
2. Click node to access Properties panel
3. Click "New Condition"
4. Choose condition type:
   - **Compare values**: Value comparison conditions
   - **Custom Script**: Java script for complex logic
   - **Call a list functions**: List manipulation functions
   - **Call a function**: Specific function execution
   - **Call a remote function**: Remote function execution
5. Save and run process

#### Managing While Node

**Management Options**:
- **Delete condition**: Click delete icon
- **Add description**: Click Description tab
- **Reorder conditions**: Drag and drop

**Best Practice**: Use with UI Screen nodes to ensure continuous UI functionality.

---

### Do While Node

**Purpose**: Executes loop at least once before evaluating condition. Actions performed initially without checking condition, then condition evaluated to determine continuation.

**Use Case**: Ensure actions execute at least once before checking if they should repeat.

**Key Difference from While**:
- **While**: Checks condition BEFORE first execution
- **Do While**: Checks condition AFTER first execution

**Permissions**: Data Engineer, Data Scientist, Skill Developer, Administrator

#### Using Do While Node

**Configuration Steps**:

1. Drag and drop Do While node to Process
2. Click node to access Properties panel
3. Click "New Condition"
4. Choose condition type:
   - **Compare values**: Value comparison
   - **Custom Script**: Java scripting
   - **Call a list functions**: List functions
   - **Call a function**: Function execution
   - **Call a remote function**: Remote function
5. Save and run process

#### Managing Do While Node

**Management Options**:
- **Delete condition**: Click delete icon
- **Add description**: Click Description tab
- **Reorder conditions**: Drag and drop

**Guaranteed Execution**: Loop body always executes at least once, regardless of condition.

---

### Script Node

**Purpose**: Write custom scripts to manipulate variables, add logic, and perform various operations using Java methods.

**Capabilities**:
- Custom scripting (Java)
- Assign values to variables
- Call list functions
- Call functions
- Assign to UserType variables
- Call remote functions

**Java Platform**: All standard Java Platform SE 8 features available, plus extended methods for UserType variables.

**Permissions**: Data Engineer, Data Scientist, Skill Developer, Administrator

#### Using Script Node

**Configuration Steps**:

1. Drag and drop Script node to Process
2. Click node to access Properties panel
3. Click "+ New Step"
4. Choose step type:
   - **Custom Script**: Write Java code
   - **Assign values**: Set variable values
   - **Call a list functions**: Execute list operations
   - **Call a function**: Execute specific function
   - **Assign to UserType**: Map values to UserType
   - **Call a remote function**: Execute remote function
5. Save and run process

#### Script Node Operations

##### Custom Script

Write Java code directly. See "Custom Script" section in fundamentals or examples in Advanced Techniques section below.

##### Assign Values

Similar to Compare values in conditional nodes. Set variable values using operators and expressions.

##### Call List Functions

Execute list manipulation functions. See "Call list functions" section for details.

##### Call a Function

**Steps**:
1. Click "Call a function"
2. Select Function from dropdown
3. Select Return Variable
4. Select Function parameters
5. Click "Validate" to verify
6. Success/error message appears

**Validation**: Always validate before saving to ensure function calls are correct.

##### Assign to UserType

**Purpose**: Pass variable values from within process or another process variable to UserType.

**Steps**:
1. Click "Assign to UserType"
2. Select "Assign to" value from dropdown
3. Select "Assign From" value from dropdown
4. Values mapped to UserType structure

**Use Case**: Populate complex UserType variables from simple variables or other UserTypes.

##### Call a Remote Function

**Purpose**: Invoke remote functions with synchronous or asynchronous execution.

**Execution Modes**:

**Synchronous Execution**:
- Waits for function to process and return response
- Up to 20 minutes execution time
- Timeout error if exceeds 20 minutes
- Suitable for small datasets
- Waits for response before continuing
- Shares common execution environment
- Use for low latency, low resource workloads
- Ideal for inference model predictions

**Asynchronous Execution**:
- Multiple operations run concurrently without waiting
- Up to 8 hours execution time
- Suitable for extensive data processing
- Does not wait for response
- Executes in own executor (no resource sharing)
- Use for high latency, high resource workloads
- Requires callback process if specified

**Configuration Steps**:
1. Click "Call a remote function"
2. Select Function from dropdown (Current Workspace or Public)
3. Choose Execution Mode: Synchronous or Asynchronous
4. **If Asynchronous**: Select Callback Process
5. Configure function parameters
6. Validate and save

**Callback Process**: For asynchronous mode, specify process to handle results when remote function completes.

---

## Advanced Techniques

### String Variable Manipulation

#### Assign Values to String Variables

Combine UserType subvariable with fixed text:

```java
target_variable_name = usertype_variable_name.get().subvariable_name + " some text ";
```

#### Create String Array

```java
// Create a string list from an array
List<String> strings1 = Arrays.asList(new String[]{"apple", "mango", "pear"});

// Use utility functions to populate the variable
ExternalDataUtils.fillStringVariableArray(stringVariableArray.getThis(), strings1);
```

### Logging Messages in Process Logs

Log different severity levels:

```java
logDebug("message");
logInfo("message");
logError("message");
logWarn("message");
```

### Accessing User and Project Information

Get current user or project information:

```java
Current_User_ID = (null == Current_User_ID) ? getCurrentUserID() : Current_User_ID;
currentProjectID = (null == currentProjectID) ? getProjectID() : currentProjectID;
```

### Date Variable Methods

When using date variables, call `variable.dateValue()` which returns date object with methods:

```java
getMonth()
getYear()
getDay()
```

### Passing Variables Via URL

Pass variable values into process via URL:

```
&variable_name=variable_value
```

**Example**:
- Process URL: `https://demo.aeratechnology.com/#!/app/default/Process+...`
- Add parameter: `&exampleString=test`
- Variable `exampleString` in Process node receives value "test"

---

## UserType Variable Advanced Operations

### Getting Headers and Values

**Comma Separated**:
```java
// Get header
variableusertype.getUserType(0).getCommaSeperatedHeader()

// Get value
variableusertype.getUserType(0).getCommaSeperatedValue()
```

**Delimited**:
```java
// Get delimited header
variableusertype1.getUserType(0).getDelimitedHeader

// Get delimited row values (with delimiter)
variableusertype1.getUserType(0).getDelimitedRowValues("|")
```

### Copying Values Between UserTypes

```java
Copy_of_variableusertype1.get(j).fillValuesFrom(variableusertype1.get(i).getUserTypeVar());
```

**Complete Example with Loop**:
```java
for(int i = 0, j = 0; i < variableusertype1.length(); i++, j++) {
    System.out.println("Copy_of_variableusertype1 before: " + Copy_of_variableusertype1.get(j).loginid);
    Copy_of_variableusertype1.get(j).fillValuesFrom(variableusertype1.get(i).getUserTypeVar());
    System.out.println("Copy_of_variableusertype1 after: " + Copy_of_variableusertype1.get(j).loginid);
}
```

### Browsing Through UserType

**Access Methods**:
```java
// Direct access
variableusertype1.get().loginid

// In loop
variableusertype1.get(i).loginid

// Get variable at index
variableusertype1.getUserType(0).getVariableAt(i)

// Get variable by name
variableusertype1.getUserType(i).getVariable("loginid").stringValue()
```

### Setting New Values in UserType

```java
String emailnew = "aishwarya.parthasarathy@aeratechnology.com";

// Method 1: Direct assignment
variableusertype.get(0).loginid = emailnew;

// Method 2: In loop
// variableusertype.get(i).loginid = emailnew;

// Method 3: Using setVariable
variableusertype.getUserType(0).setVariable("loginid", "aishu");
```

### UserType Utility Methods

```java
variableusertype1.isEmpty();        // Check if empty
variableusertype1.moveLast();       // Move to last record
variableusertype1.moveFirst();      // Move to first record
variableusertype1.movePrev();       // Move to previous record
variableusertype1.moveNext();       // Move to next record
variableusertype1.remove(Index);    // Remove at index
variableusertype1.removeCurrent();  // Remove current record
```

### Exporting UserType to File

The `generateFile` method in `com.ispring.connector.database.DatabaseUtilities` accepts these parameters:

1. **targetFileName**: Unique filename with timestamp (e.g., `Mobile_Charts_Report_12-17-2018-11-11-01.json`)
   - Location: `/home/fusionops/ispring/download/BE8BA2A0_2B4C_48BA_B0A8_714E96548216`
2. **fileExtension**: `.csv`, `.json`, or `.xlsx`
3. **queryString**: SQL query for aggregations (SUM, AVG)
4. **queryStringTot**: SQL query for TOTAL
5. **destColumnHeaders**: JSON containing report metadata
6. **headers**: Excel file headers
7. **attributes**: Properties like title, filename, rowCount (key-value pairs)
8. **connectionID**: Report connection ID
9. **projectID**: Project ID
10. **queryTimeout**: Default 120 seconds
11. **rowCnt**: Default 500 (deprecated)
12. **isZipFile**: Boolean for zip file creation
13. **queryResultSize**: Default 500 (result set size)

---

## Command Execution Framework

### ExecutionUtil Class

Execute scripts or commands in Aera platform.

#### Methods

| Method | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| **exec** | com.ispring.client.runtime.Command | java.lang.Process | Executes command and returns Process object for result processing |
| **execAndGetResult** | com.ispring.client.runtime.Command | com.ispring.client.runtime.ExecutionResult | Executes command, reads stderr/stdout, returns ExecutionResult object |

### Building Commands with CommandBuilder

**Command Components**:
1. Command/script name
2. Parameters (named or unnamed)

#### CommandBuilder Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| **withScriptName** | String scriptName | Name of the script |
| **withParam, withNamedParam** | String paramName, String paramValue | Adds named parameter |
| **withUnamedParam** | String paramValue | Adds unnamed parameter |
| **withUnamedParams** | List<String> paramValue | Adds list of unnamed parameters |
| **withEncryptedParam, withEncryptedNamedParam** | String paramName, String encryptedValue | Adds encrypted named parameter |
| **withEncryptedUnnamedParam** | String encryptedValue | Adds encrypted unnamed parameter |

### Command Examples

#### Example 1: Plain Named Parameters

```java
Command command = new CommandBuilder().withScriptName("myScript")
    .withParam("param1", "param1-value")
    .withParam("param2", "param2-value").build();
```

**Executes**: `myScript param1 param1-value param2 param2-value`

#### Example 2: Plain Unnamed Parameters

```java
Command command = new CommandBuilder().withScriptName("myScript")
    .withUnnamedParam("param1-value")
    .withUnnamedParam("param2-value").build();
```

**Executes**: `myScript param1-value param2-value`

#### Example 3: Unnamed Parameters from List

```java
Command command = new CommandBuilder().withScriptName("myScript")
    .withUnnamedParams("param1-value", "param2-value")
    .build();
```

**Executes**: `myScript param1-value param2-value`

#### Example 4: Encrypted Named Parameters

```java
Command command = new CommandBuilder().withScriptName("myScript")
    .withNamedParam("db-user", "john")
    .withEncryptedNamedParam("db-pass", "C2A2681368565E908818CB03D39A3ECC")
    .build();
```

**Executes**: `myScript db-user john db-pass doe`

(System decrypts `C2A2681368565E908818CB03D39A3ECC` to `doe`)

#### Example 5: Encrypted Unnamed Parameters

```java
Command command = new CommandBuilder().withScriptName("myScript")
    .withUnnamedParams("user1", "user2", "user3")
    .withEncryptedUnnamedParam("C2A2681368565E908818CB03D39A3ECC")
    .withUnnamedParam("user4")
    .build();
```

**Executes**: `myScript user1 user2 user3 doe user4`

#### Example 6: Execute Command via Platform

```java
Command command = new CommandBuilder().withScriptName("myScript")
    .withNamedParam("db-user", "john")
    .withEncryptedNamedParam("db-pass", "C2A2681368565E908818CB03D39A3ECC")
    .build();
ExecutionUtil.exec(command);
```

**Executes**: `myScript db-user john db-pass doe`

### Encrypted Parameters

**Automatic Decryption**: System automatically decrypts encrypted parameters before passing to command.

**Use Case**: Secure handling of sensitive data like passwords, API keys, credentials.

---

## Best Practices

### Naming Conventions

#### Variable Names

**Rules**:
- Must be unique within scope
- Alphanumeric characters only
- No spaces
- Lowercase preferred
- Cannot be empty

**Valid Examples**:
- `actionMessageID`
- `BLANK`
- `salesTransfer`
- `filterJSON`
- `Get_Max_LOC`
- `Material_Categories`
- `selectedCategory`
- `selectedLocation`
- `selectedMaterial`
- `selectedMaterialLocation`
- `selectedMatLoc`
- `showRecommendation`

#### Node Names

**Rules**:
- Must accurately describe purpose and function
- Use capitalization at beginning of new words
- Need not be unique (but preferable)
- Alphanumeric characters
- Can include spaces
- Cannot be empty

**Valid Examples**:
- `Test Process`
- `Tabs Component`
- `About the Process`
- `Forever`
- `Manage Users`
- `If Manage Users Tab`
- `Manage Users Tab`

**Application**:
- Applies when naming nodes
- Applies when editing descriptions
- **Exception**: When editing variables or adding variable titles, use variable naming conventions

### Right-Click Shortcuts

**Available on All Nodes**:

| Shortcut | Description |
|----------|-------------|
| **Copy** | Copies node for pasting elsewhere |
| **Copy id** | Copies node's unique ID |
| **Copy branch** | Copies entire branch |
| **Cut** | Cuts node for moving |
| **Paste** | Pastes copied/cut item |
| **Delete** | Deletes node (warning if used elsewhere) |
| **Collapse** | Hides all following nodes (click to expand) |

**Usage**: Right-click on any node to access shortcuts menu.

### History and Version Control

**Access History**:
- Right-click any file from Process Builder menu
- Options: History, Rename, Delete, Open

**Version Tracking**: View changes, timestamps, and authors for any process object.

### Performance Optimization

#### Improve Processing Time with Asynchronous Nodes

**Problem**: Sequential interface execution causes latency with large data volumes or many interfaces.

**Solution**: Use Asynchronous Node with subprocesses to execute interfaces simultaneously.

**Performance Gain**:
- Without async: Total time = Sum of all interface times
- With async: Total time = Longest interface time

**Example**:
- Interface 1: 1 second
- Interface 2: 2 seconds
- Interface 3: 3 seconds
- **Sequential**: 6 seconds total
- **Asynchronous**: 3 seconds total

#### Implementation Steps

**High-Level Flow**:

1. **Add Asynchronous Node** to main process (before Interface nodes)
   - Create one Asynchronous Node per Interface
2. **Create Subprocesses** containing Interface nodes
3. **Map Variables** - Use same variable names and types in subprocesses
   - UserType variables must match EXACTLY (order, type, name, case)
4. **Click Apply and Save**

**Important Constraints**:
- Asynchronous Node alone cannot be used in processes with UI components
- Must use subprocess pattern to avoid blocking UI
- Variable mapping must be exact for UserType variables

**Visual Flow**:
```
Main Process → Asynchronous Node → Subprocess 1 (Interface A)
            → Asynchronous Node → Subprocess 2 (Interface B)
            → Asynchronous Node → Subprocess 3 (Interface C)
```

All subprocesses execute in parallel, dramatically reducing total execution time.

---

## Reserved Java Keywords

**Cannot be used as variable names**:

| | | | | | |
|---|---|---|---|---|---|
| abstract | assert | Boolean | break | byte | case |
| catch | char | class | const | continue | default |
| double | do | else | enum | extends | false |
| final | finally | float | for | goto | if |
| implements | import | instanceof | int | interface | long |
| native | new | null | package | private | protected |
| public | return | short | static | strictfp | super |
| switch | synchronized | this | throw | throws | transient |
| true | try | void | volatile | while | |

**Notes**:
- `goto` and `const` no longer used but still reserved
- `strictfp` added in Java SE 1.2
- `assert` added in version 1.4
- `enum` added in version 5.0

**Error Example**:
```java
// INVALID - 'finally' is reserved
class finally {
    public static void main(String[] args) {
        // code
    }
}

// Error: <identifier> expected
```

---

## Tips and Tricks

### General Tips

1. **Use Right-Click Shortcuts** for faster workflow
2. **Collapse Branches** to manage complex processes visually
3. **Copy Node IDs** from Profiler to locate nodes in large processes
4. **Use History** to track changes and revert if needed
5. **Validate Scripts** before saving to catch errors early

### Variable Tips

1. **Generate Variables** from Data Views/Reports for automatic schema matching
2. **Use UserType Variables** for complex data structures
3. **Watch Variables** in debugger by starring them
4. **Clear Cache** in Report/Data View nodes when data changes

### Performance Tips

1. **Use Asynchronous Nodes** for parallel processing
2. **Batch Similar Operations** in single nodes when possible
3. **Cache Report Data** unless real-time data required
4. **Limit Result Sets** with filters to reduce data transfer

### Debugging Tips

1. **Set Breakpoints** on critical nodes
2. **Watch Variables** to track value changes
3. **Use Profiler** to identify slow nodes
4. **Check Process Logs** for detailed error information
5. **Validate Conditions** before running full process

---

## Quick Reference Tables

### Node Comparison

| Node | Purpose | When to Use | Execution |
|------|---------|-------------|-----------|
| **IF** | Conditional branching | Single decision point | Checks condition, executes one branch |
| **While** | Pre-condition loop | Repeat while condition true | Checks BEFORE executing |
| **Do While** | Post-condition loop | Execute at least once | Checks AFTER executing |
| **Script** | Custom logic | Complex calculations, variable manipulation | Sequential steps |

### Execution Mode Comparison

| Aspect | Synchronous | Asynchronous |
|--------|------------|--------------|
| **Max Time** | 20 minutes | 8 hours |
| **Waits for Response** | Yes | No |
| **Resource Sharing** | Shared environment | Own executor |
| **Best For** | Low latency, small datasets | High latency, large datasets |
| **Timeout** | Error if >20 minutes | Handles long processes |
| **Callback** | Not needed | Optional callback process |

### Variable Access Patterns

| Pattern | Syntax | Use Case |
|---------|--------|----------|
| **Direct Access** | `variable.get().field` | Current record |
| **Indexed Access** | `variable.get(i).field` | Specific record in loop |
| **By Name** | `variable.getUserType(i).getVariable("field")` | Dynamic field access |
| **Set Value** | `variable.get(0).field = value` | Update field |
| **Set by Method** | `variable.getUserType(0).setVariable("field", value)` | Update with validation |

---

## Related Documentation

- See `process-builder-fundamentals.md` for basics:
  - Process creation and management
  - Basic node usage (Interface, Process, Transaction)
  - Debugger and Profiler fundamentals
  - Branch/merge workflows
  - Global and session variables

- **Next Topics** (if available):
  - UI Screen Nodes integration
  - Agent Team Node usage
  - Stream Node and real-time data
  - Data Science Node for ML integration
  - Rule Node for business rules
  - Notification Node for alerts
  - Subprocess and Dynamic Subprocess patterns

---

## Common Patterns

### Pattern: Conditional Data Processing

```
Process → Data View → IF Node → Branch 1: Process Type A
                              → Branch 2: Process Type B
                              → Else: Log Error
```

### Pattern: Iterative Data Loading

```
Process → While Node → Data View (filtered) → Process Batch → Update Counter
```

### Pattern: Parallel Interface Execution

```
Process → Async Node → Subprocess 1 (Interface A)
       → Async Node → Subprocess 2 (Interface B)
       → Async Node → Subprocess 3 (Interface C)
       → Wait Node → Combine Results
```

### Pattern: Report Generation with Filters

```
Process → Report Data → Add Filters → Generate Variable → Export to File
```

---

## Troubleshooting

### Common Issues

**Issue**: UserType variable mapping fails between processes
- **Cause**: Subvariables don't match exactly (order, type, name, case)
- **Solution**: Verify exact match of all subvariables

**Issue**: Asynchronous execution timeout
- **Cause**: Operation exceeds 20 minutes in synchronous mode
- **Solution**: Switch to asynchronous execution mode

**Issue**: Report Data node returns no results
- **Cause**: Cache not cleared after data changes
- **Solution**: Enable "Clear cache" option

**Issue**: Script node validation fails
- **Cause**: Reserved Java keyword used as variable name
- **Solution**: Rename variable to avoid reserved keywords

**Issue**: While loop never terminates
- **Cause**: Condition never becomes false
- **Solution**: Ensure loop modifies condition variables

---

## Summary

This advanced documentation covers:

✅ **7 Advanced Nodes**: Report Data, Data View, IF, While, Do While, Script, with full configuration details

✅ **Advanced Techniques**: String manipulation, logging, date handling, URL parameters, UserType operations

✅ **Command Execution**: CommandBuilder, ExecutionUtil, encrypted parameters

✅ **Best Practices**: Naming conventions, performance optimization, debugging strategies

✅ **Reference Tables**: Node comparisons, execution modes, variable patterns, reserved keywords

✅ **Troubleshooting**: Common issues and solutions

**Key Takeaways**:
- Data View nodes eliminate SQL queries for data access
- Asynchronous nodes dramatically improve performance for parallel operations
- UserType variables provide powerful data structure capabilities
- Script nodes offer full Java SE 8 functionality
- Proper naming conventions and best practices prevent common issues

For foundational concepts, see `process-builder-fundamentals.md`.
