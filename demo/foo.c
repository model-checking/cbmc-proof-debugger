int foo(int *ptr) {
  for (int i = 0; i<2; i++) {
    *ptr = 1;
  }
  return 1;
}

int sum(int x, int y) {
  int result = x + y;
  return result;
}
