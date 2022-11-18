# CBMC Proof Debugger

The
[CBMC Proof Debugger](https://github.com/model-checking/cbmc-proof-debugger)
is a
[Visual Studio Code](https://code.visualstudio.com/)
debugger for
[CBMC](https://github.com/diffblue/cbmc)
error traces.

[CBMC](https://github.com/diffblue/cbmc)
is a model checker for C.  CBMC will explore all possible paths
through your code on all possible inputs, and will check that all
assertions in your code are true. CBMC can also check for the
possibility of security issues (like buffer overflow) and for
instances of undefined behavior (like signed integer overflow).
If CBMC finds a code issue, it generates an error trace demonstrating how that
issue could occur.
If CBMC terminates without finding any issues, the result is
assurance that your code behaves as expected.
CBMC is a *bounded* model checker, however, so getting CBMC to terminate
may require restricting inputs to some bounded size,
and CBMC's assurance is restricted to these bounded inputs.

[CBMC Viewer](https://github.com/model-checking/cbmc-viewer)
is a tool that scans the output of CBMC and produces a browsable summary
of its findings, making it easy to root cause the issues CBMC finds using
any web browser.  Viewer also produces a summary of its findings in the
form of a collection of json blobs.

The
[CBMC Proof Debugger](https://github.com/model-checking/cbmc-proof-debugger)
loads the json summaries produced by CBMC Viewer,
and lets a developer explore the error traces produced by CBMC using
the Visual Studio Code's debugger.

To get started, see our
* [installation instructions](user-guide/installation.md) and a
* [simple demonstration](demo) of how to use the proof debugger.

References:
* [User guide](user-guide)
* [Developer guide](developer-guide)
* [Frequently asked questions](faq)