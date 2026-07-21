CXX = g++
CXXFLAGS = -O3 -Wall -std=c++11

all: sfe_cli sfe_linux_middleman

sfe_cli: sfe_cli.cpp
	$(CXX) $(CXXFLAGS) -ldl -o sfe_cli sfe_cli.cpp

sfe_linux_driver.o: sfe_linux_driver.cpp sfe_linux_driver.h
	$(CXX) $(CXXFLAGS) -c sfe_linux_driver.cpp -o sfe_linux_driver.o

sfe_linux_middleman: sfe_middleman.cpp sfe_linux_driver.o
	$(CXX) $(CXXFLAGS) sfe_linux_driver.o sfe_middleman.cpp -ldl -lpthread -o sfe_linux_middleman

clean:
	rm -f sfe_cli sfe_linux_middleman *.o
