int main()
{
	int a = 0;
	int* b = &a;
	int& c = a; // c is an automatically deferencing pointer
	int d = c; // => d = a = 0
	return 0;
}