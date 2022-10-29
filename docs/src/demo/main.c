#include <stdlib.h>

int foo(int *ptr);
int sum(int x, int y);

int global_int = 1;

void main() {

  int x;
  int y;
  int *ptr;

  // Step both directions in the trace

  x = x + 1;
  y = y + 1;

  // Step over functions

  sum(x, y);

  // Step into and out of functions

  sum(x, y);

  // Demonstrate stack model

  int value = sum(1, 4);


  int i = 1;
  char ch = 'c';
  char str[] = "abc";

  int array[] = {1,2,3,4};

  int array2[4];
  array2[0] = 1;

  struct tag { int a; int b;};
  struct tag mystruct = { 10, 11};

  struct tag2 { int a; int b[2];};
  struct tag2 mystruct2 = {20, {21, 22}};

  // Heap model

  struct tag2 *structp;
  structp = malloc(sizeof(struct tag2));
  structp->b[1] = 100;

  // Statics model

  global_int = 10;

  // Static file-local model

  static int static_int = 1;
  static_int = 10;

  // Failures
  foo(ptr);

  // Also breakpoints
  // Also run to failure, examine the stack, back up to examine trace
}
