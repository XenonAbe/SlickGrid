<?php


/**
 * Return the HTTP response code string for the given response code
 */
function get_response_code_string($response_code)
{
  $response_code = intval($response_code);
  switch ($response_code)
  {
  case 100:   return "RFC2616 Section 10.1.1: Continue";
  case 101:   return "RFC2616 Section 10.1.2: Switching Protocols";
  case 200:   return "RFC2616 Section 10.2.1: OK";
  case 201:   return "RFC2616 Section 10.2.2: Created";
  case 202:   return "RFC2616 Section 10.2.3: Accepted";
  case 203:   return "RFC2616 Section 10.2.4: Non-Authoritative Information";
  case 204:   return "RFC2616 Section 10.2.5: No Content";
  case 205:   return "RFC2616 Section 10.2.6: Reset Content";
  case 206:   return "RFC2616 Section 10.2.7: Partial Content";
  case 300:   return "RFC2616 Section 10.3.1: Multiple Choices";
  case 301:   return "RFC2616 Section 10.3.2: Moved Permanently";
  case 302:   return "RFC2616 Section 10.3.3: Found";
  case 303:   return "RFC2616 Section 10.3.4: See Other";
  case 304:   return "RFC2616 Section 10.3.5: Not Modified";
  case 305:   return "RFC2616 Section 10.3.6: Use Proxy";
  case 307:   return "RFC2616 Section 10.3.8: Temporary Redirect";
  case 400:   return "RFC2616 Section 10.4.1: Bad Request";
  case 401:   return "RFC2616 Section 10.4.2: Unauthorized";
  case 402:   return "RFC2616 Section 10.4.3: Payment Required";
  case 403:   return "RFC2616 Section 10.4.4: Forbidden";
  case 404:   return "RFC2616 Section 10.4.5: Not Found";
  case 405:   return "RFC2616 Section 10.4.6: Method Not Allowed";
  case 406:   return "RFC2616 Section 10.4.7: Not Acceptable";
  case 407:   return "RFC2616 Section 10.4.8: Proxy Authentication Required";
  case 408:   return "RFC2616 Section 10.4.9: Request Time-out";
  case 409:   return "RFC2616 Section 10.4.10: Conflict";
  case 410:   return "RFC2616 Section 10.4.11: Gone";
  case 411:   return "RFC2616 Section 10.4.12: Length Required";
  case 412:   return "RFC2616 Section 10.4.13: Precondition Failed";
  case 413:   return "RFC2616 Section 10.4.14: Request Entity Too Large";
  case 414:   return "RFC2616 Section 10.4.15: Request-URI Too Large";
  case 415:   return "RFC2616 Section 10.4.16: Unsupported Media Type";
  case 416:   return "RFC2616 Section 10.4.17: Requested range not satisfiable";
  case 417:   return "RFC2616 Section 10.4.18: Expectation Failed";
  case 500:   return "RFC2616 Section 10.5.1: Internal Server Error";
  case 501:   return "RFC2616 Section 10.5.2: Not Implemented";
  case 502:   return "RFC2616 Section 10.5.3: Bad Gateway";
  case 503:   return "RFC2616 Section 10.5.4: Service Unavailable";
  case 504:   return "RFC2616 Section 10.5.5: Gateway Time-out";
  case 505:   return "RFC2616 Section 10.5.6: HTTP Version not supported";
/*
  case 102:   return "Processing";  // http://www.askapache.com/htaccess/apache-status-code-headers-errordocument.html#m0-askapache3
  case 207:   return "Multi-Status";
  case 418:   return "I'm a teapot";
  case 419:   return "unused";
  case 420:   return "unused";
  case 421:   return "unused";
  case 422:   return "Unproccessable entity";
  case 423:   return "Locked";
  case 424:   return "Failed Dependency";
  case 425:   return "Node code";
  case 426:   return "Upgrade Required";
  case 506:   return "Variant Also Negotiates";
  case 507:   return "Insufficient Storage";
  case 508:   return "unused";
  case 509:   return "unused";
  case 510:   return "Not Extended";
*/
  default:   return rtrim("Unknown Response Code " . $response_code);
  }
}



// where the json file(s) will reside:
define('DATA_DIR', 'data');


function sanitize_filename($filename)
{
  // minimal bit of security: only allow filenames, no paths, and we'll be loading from (and saving to) a dedicated subdirectory:
  $filename = pathinfo($filename, PATHINFO_FILENAME);
  
  // be very strict about the filename itself: kill almost everything ;-)
  $filename - preg_replace('/[^a-z0-9_]/i', '_', $filename);
  $filename - preg_replace('/_+/', '_', $filename);
  $filename = strtolower($filename);
  if (empty($filename)) $filename = '__john_doe__';

  return DATA_DIR . '/' . $filename . '.json';
}




function transmit_json_response($statusCode, $data)
{
  $status_header = 'HTTP/1.1 ' . $statusCode . ' ' . get_response_code_string($statusCode);
  header($status_header, true /* replace */, $statusCode);
  // and the content type
  header('Content-type: application/json; charset=UTF-8', true);

  $rv = $data;
  if (empty($data)) 
  {
      $rv = $data = array(
          'status' => 'fail',
          'message' => 'Bad server boo-boo: ' . get_response_code_string($statusCode)
      );
  }

  if (!is_array($data) && !is_object($data))
  {
      // when data is not an object or array, it's *wrong* by decree and we go *fail*:
      $rv = array(
          'status' => 'fail',
          'message' => 'Bad internal data format; this is a server boo-boo.',
          'bad_data' => $data
      );
  }

  // by decree, the JSON response ALWAYS must have a 'status' field
  // and when that one is *not* success, then the 'message' field must
  // be provided and non-empty as well!
  if (empty($data['status']))
  {
      // when data does not adhere to the decreed standard, *fail*:
      $rv = array(
          'status' => 'fail',
          'message' => 'Bad internal response setup: fail field is missing; this is a server boo-boo.',
          'bad_response' => $data
      );
  }
  if ($data['status'] !== 'success' && empty($data['message']))
  {
      // when data does not adhere to the decreed standard, *fail*:
      $rv = array(
          'status' => 'fail',
          'message' => 'Bad internal response setup: message field is missing; this is a server boo-boo.',
          'bad_response' => $data
      );
  }

  echo json_format($rv);
  die();
}

