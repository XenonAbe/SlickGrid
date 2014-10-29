<?php

require_once(dirname(__FILE__) . '/php/support.php');

// Load the json_encode JSON_PRETTY_PRINT shim: json_format($json) ≡ json_encode($json, JSON_PRETTY_PRINT)
require_once(dirname(__FILE__) . '/php/lib/niceJSON/nicejson.php');






if (!empty($_REQUEST['load']))
{
  serve_json($_REQUEST['load']);
}
if (!empty($_REQUEST['save']))
{
  store_json($_REQUEST['save'], $_REQUEST['data']);
}




function serve_json($filename)
{
  // minimal bit of security: only allow filenames, no paths, and we'll be loading from (and saving to) a dedicated subdirectory:
  $filename = sanitize_filename($filename);
  if (file_exists($filename))
  {
    $content = @file_get_contents($filename);
    $data = json_decode($content);
    $statusCode = 200;
  }
  else
  {
    $data = array(
        'status' => 'fail',
        'message' => 'Cannot read file: ' . $filename,
        'filename' => $filename
    );
    $statusCode = 404;
  }

  transmit_json_response($statusCode, $data);
}

function store_json($filename, $content)
{
  // minimal bit of security: only allow filenames, no paths, and we'll be loading from (and saving to) a dedicated subdirectory:
  $filename = sanitize_filename($filename);

  // we allow overwriting files, no problem. As long as the content is anywhere near legal...
  $data = json_decode($content);
  // by decree, the incoming JSON message ALWAYS must have a 'status' field
  // and that one MUST be 'success'!
  if (!empty($data) && !empty($data['status']) && $data['status'] === 'success')
  {
    // input okay-ed, now save:
    @file_put_contents($filename, json_format($data));
    $statusCode = 200;
    $data = array(
        'status' => 'success',
        'message' => 'Data saved to file: ' . $filename,
        'filename' => $filename
    );
  }
  else
  {
    $data = array(
        'status' => 'fail',
        'message' => 'Received data is not acceptable',
        'filename' => $filename
    );
    $statusCode = 404;
  }

  transmit_json_response($statusCode, $data);
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
  <title>SlickGrid Load/Save Page for the Example Server</title>
  <style>
    body {
      font-family: Helvetica, arial, freesans, clean, sans-serif;
      font-size: 15px;
    }

    a {
      color: #4183c4;
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    li {
      margin-bottom: 15px;
    }
  </style>
</head>
<body>
  <h1>Load/Save Page for the Example Server</h1>
  <p>
  This page usually serves as the API entry point for the 'Examples Index' and possibly other examples, serving JSON from or receiving JSON for storage.
  </p>
  
  <h2>API entry points</h2>
  <dl>
    <dt><code>load=&lt;filename&gt;</code></dt> <dd>serves JSON data from the specified file (or an error report)</dd>
    <dt><code>save=&lt;filename&gt; data=&lt;content&gt;</code></dt> <dd>stores the JSON data (<code>content</code>) to the specified file. The response is either a success message or an error report.</dd>
  </dl>

  <p>Requests may be sent as GET or POST requests as the code internally uses the PHP <code>$_REQUEST</code> superglobal to access the message data.</p>
</body>
</html>
