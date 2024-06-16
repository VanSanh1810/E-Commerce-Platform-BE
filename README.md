
# Ecomerce platform API

This is a API service for client UI in this [repo](https://gitlab.com/kltl-ute/242k/02-fe.git).


## Tech Stack

**Client:** Next, Redux, Bootstrap

**Server:** Node, Express


## Running Tests

> We use **MongoDB Community** version **6.0.6**

To run tests, run the following command

- Repare image data
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1. Download folder `uploads` from this [url](https://drive.google.com/file/d/1jZ0BfGoaYJP5RoTTrqXWErT7JmBwXdYA/view?usp=sharing)

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2. Extract and put it in `/src/public`

&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3. Final structure should be like this
```
src
└───public
    │───css
    └───uploads
         │──[uid].img
         └──...
```


- Install dependency packages

```bash
  npm install
```

- Import json data

```bash
  npm run generate
```

- Run test enviroment

```bash
  npm run devStart
```
> Also run the UI source [here](https://gitlab.com/kltl-ute/242k/02-fe.git).
## Authors

- [@VanSanh](https://github.com/VanSanh1810)
- [@TanPhat](https://github.com/TanPhat21242002)

