# Configuration

To create a debugger configuration for the CBMC Proof Debugger, click on
the Run and Debug icon

<img src="run-and-debug-icon.png" alt="Run and Debug icon"
     style="height: 40px; margin: auto; display: block;">

in the Activity Bar on the left.

* If you have already configured some debuggers like lldb, you will see
  a drop-down list of configured debuggers

  <img src="debugger-list.png" alt="Configured debuggers"
       style="height: 40px; margin: auto; display: block;">

  Expand the drop-down list, click on "Add Configuration," click on
  "CBMC Proof Debugger" in the list of available debuggers,
  and save the `launch.json` configuration file.

* If you are configuring your first debugger, you will see the Run view

  <img src="https://code.visualstudio.com/assets/docs/editor/debugging/launch-configuration.png"
       alt="Run start view"
       style="height: 400px; margin: auto; display: block;">

  Click on "create a launch.json file" and select "CBMC Proof Debugger"
  from the list of available debuggers,
  and save the `launch.json` configuration file.

For more information, read about
[launch configurations](https://code.visualstudio.com/docs/editor/debugging#_launch-configurations).