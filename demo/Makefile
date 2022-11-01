default: report


#CBMC_FLAGS= --pointer-check --bounds-check --signed-overflow-check --unwind 1
CBMC_FLAGS= --pointer-check --bounds-check --unwind 1

%.goto: %.c
	goto-cc -c -o $@ $<

test.goto: foo.goto main.goto
	goto-cc -o $@ $?

result.xml: test.goto
	-cbmc $(CBMC_FLAGS) --unwinding-assertions --xml-ui $< > $@

coverage.xml: test.goto
	-cbmc --cover location --xml-ui  $< > $@

property.xml: test.goto
	-cbmc --show-properties $(CBMC_FLAGS) --unwinding-assertions --xml-ui  $< > $@

report: test.goto result.xml coverage.xml property.xml
	cbmc-viewer \
	    --result result.xml \
	    --coverage coverage.xml \
	    --property property.xml \
	    --srcdir . \
	    --goto test.goto

loop.xml: test.goto
	cbmc --show-loops --xml-ui $< > $@

viewer-property.json: property.xml
	make-property --srcdir . $< > $@

viewer-coverage.json: coverage.xml
	make-coverage --srcdir . $< > $@

viewer-result.json: result.xml
	make-result  $< > $@

viewer-loop.json: loop.xml
	make-loop --srcdir . $< > $@

clean:
	$(RM) *~
	$(RM) *.goto
	$(RM) *.json
	$(RM) *.xml
	$(RM) -r report
	$(RM) *.vsix
	$(RM) -r .vscode

.PHONY: report demo

demo:
	$(MAKE) clean
	$(RM) -r .vscode
	- code --uninstall-extension mrtuttle.proof-debugger
	make -C ..
	cp ../proof-debugger-*.vsix .
	@echo
	@echo 'Do: make report'
	@echo 'Do: code --install-extension proof-debugger-*.vsix'
	@echo 'Do: code .'
	@echo 'Configure'
	@echo 'Load traces'
	@echo 'Debug'
