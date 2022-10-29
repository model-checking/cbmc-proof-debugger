default:
	./node_modules/.bin/vsce package

install:
	code --install-extension proof-debugger-*.vsix

format:
	./node_modules/.bin/tsfmt -r src/*.ts

clean:
	$(RM) *~
	cd demo && make clean

veryclean: clean
	$(RM) -r out
	$(RM) src/*.js
	$(RM) *.vsix

.PHONY: default install format clean veryclean
